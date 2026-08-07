import AppIconButton from '@/components/Button/AppIconButton';
import { AppPopover } from '@/components/Overlay';
import type { TreeDataNode } from '@/components/Tree';
import Tree from '@/components/Tree';
import { useChatService } from '@/domains';
import { buildDefaultPersonalAgent, type ChatAgentOption, type PageResult } from '@/domains/Chat';
import type { Group } from '@/domains/Group';
import { parseErrorMessage } from '@/utils/error';
import { Button, ListBox, ListBoxItem, Skeleton, toast } from '@heroui/react';
import { useLatest, useRequest } from 'ahooks';
import { Bot, Check, Folder } from 'lucide-react';
import type { Key } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatInputStore, useChatInputStoreApi } from '../_store/ChatInputStore';
import styles from '../style.module.less';

interface AgentPickerProps {
  injectedAgents?: ChatAgentOption[];
  preferredAgent?: ChatAgentOption | null;
}

const AGENT_SKELETON_ROWS = [0, 1] as const;
const AGENT_PAGE_SIZE = 30;
const GROUP_PAGE_SIZE = 20;
const GROUP_NODE_PREFIX = 'group:';
const LOAD_MORE_NODE_PREFIX = 'load-more-agent:';

interface AgentGroupState {
  groupId: string;
  groupName: string;
  items: ChatAgentOption[];
  page: number;
  totalPage: number;
}

function mergeAgentOptions(
  agents: ChatAgentOption[],
  injectedAgents: ChatAgentOption[] = []
): ChatAgentOption[] {
  const seen = new Set<string>();
  return [...injectedAgents, ...agents].filter((agent) => {
    if (seen.has(agent.agentId)) return false;
    seen.add(agent.agentId);
    return true;
  });
}

function AgentMenuSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      className={`${styles.popoverPanel} ${styles.popoverPanelAgent} ${styles.popoverPanelAgentSkeleton}`}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={styles.popoverSkeletonList}>
        {AGENT_SKELETON_ROWS.map((row) => (
          <div key={row} className={styles.popoverSkeletonRow}>
            <Skeleton className={styles.popoverSkeletonIcon} />
            <Skeleton
              className={`${styles.popoverSkeletonLabel} ${row === 0 ? styles.popoverSkeletonLabelWide : ''}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentPicker({ injectedAgents, preferredAgent }: AgentPickerProps) {
  const { t } = useTranslation('chat');
  const chatService = useChatService();
  const store = useChatInputStoreApi();
  const selectedAgent = useChatInputStore((state) => state.selectedAgent);
  const { setSelectedAgent } = store.getState();
  const [open, setOpen] = useState(false);
  const [personalAgents, setPersonalAgents] = useState<ChatAgentOption[]>([]);
  const [personalPage, setPersonalPage] = useState<PageResult<ChatAgentOption> | null>(null);
  const [loadingMorePersonal, setLoadingMorePersonal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupPage, setGroupPage] = useState<PageResult<Group> | null>(null);
  const [loadingMoreGroups, setLoadingMoreGroups] = useState(false);
  const [groupStateMap, setGroupStateMap] = useState<Record<string, AgentGroupState>>({});
  const { loading } = useRequest(
    () =>
      chatService.listChatInputAgents({
        scope: 'PERSONAL',
        page: 1,
        size: AGENT_PAGE_SIZE,
      }),
    {
      ready: open,
      refreshDeps: [open],
      onSuccess: (page) => {
        setPersonalAgents(page.list);
        setPersonalPage(page);
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const { loading: loadingGroups } = useRequest(
    () => chatService.listChatInputGroups({ page: 1, size: GROUP_PAGE_SIZE }),
    {
      ready: open,
      refreshDeps: [open],
      onBefore: () => {
        setGroups([]);
        setGroupPage(null);
        setGroupStateMap({});
      },
      onSuccess: (page) => {
        setGroups(page.list);
        setGroupPage(page);
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const showSkeleton = personalPage == null && loading;
  const displayAgents = mergeAgentOptions(
    [buildDefaultPersonalAgent(), selectedAgent, ...personalAgents],
    injectedAgents
  );
  const hasMorePersonalAgents = personalPage != null && personalPage.page < personalPage.totalPage;
  const hasMoreGroups = groupPage != null && groupPage.page < groupPage.totalPage;
  const injectedAgentKey = JSON.stringify(injectedAgents ?? []);
  const preferredAgentKey = JSON.stringify(preferredAgent ?? null);
  const injectedAgentsLatest = useLatest(injectedAgents);
  const preferredAgentLatest = useLatest(preferredAgent);
  const skeleton = <AgentMenuSkeleton ariaLabel={t('input.agentPicker.loadingAria')} />;

  const buildGroupNodeTitle = (groupName: string) => (
    <span className={styles.agentGroupTitle}>
      <Folder size={14} color="var(--resource-icon-folder)" />
      <span>{groupName}</span>
    </span>
  );

  const loadGroupAgents = async (
    ownerKey: string,
    group: Pick<Group, 'groupId' | 'groupName'>,
    page: number
  ) => {
    const result = await chatService.listChatInputAgents({
      scope: 'GROUP',
      groupId: group.groupId,
      groupName: group.groupName,
      page,
      size: AGENT_PAGE_SIZE,
    });
    setGroupStateMap((prev) => {
      const current = prev[ownerKey];
      return {
        ...prev,
        [ownerKey]: {
          groupId: group.groupId,
          groupName: group.groupName,
          items: page === 1 || !current ? result.list : [...current.items, ...result.list],
          page: result.page,
          totalPage: result.totalPage,
        },
      };
    });
  };

  const groupTreeData: TreeDataNode[] = groups.map((group) => {
    const ownerKey = `${GROUP_NODE_PREFIX}${group.groupId}`;
    const state = groupStateMap[ownerKey];
    const children = state
      ? [
          ...state.items.map((agent) => ({
            key: agent.agentId,
            title: (
              <span className={styles.agentTreeLeaf}>
                <Bot size={14} />
                <span>{agent.isDefault ? t('input.agentPicker.defaultAgent') : agent.label}</span>
              </span>
            ),
            isLeaf: true,
          })),
          ...(state.page < state.totalPage
            ? [
                {
                  key: `${LOAD_MORE_NODE_PREFIX}${ownerKey}:${state.page + 1}`,
                  title: t('session.loadMore'),
                  isLeaf: true,
                },
              ]
            : []),
        ]
      : undefined;

    return {
      key: ownerKey,
      title: buildGroupNodeTitle(group.groupName),
      selectable: false,
      isLeaf: false,
      children,
    };
  });

  const syncPreferredAgent = () => {
    const injectedAgentIds = new Set(
      (injectedAgentsLatest.current ?? []).map((agent) => agent.agentId)
    );
    const currentPreferredAgent = preferredAgentLatest.current;
    const currentAgent = store.getState().selectedAgent;
    if (currentAgent.source === 'CURRENT_DRAFT' && !injectedAgentIds.has(currentAgent.agentId)) {
      setSelectedAgent(buildDefaultPersonalAgent());
      return;
    }
    if (!currentPreferredAgent) return;
    if (!currentAgent.isDefault && currentAgent.source !== 'CURRENT_DRAFT') return;
    if (currentAgent.agentId === currentPreferredAgent.agentId) {
      if (currentAgent.source === 'CURRENT_DRAFT' && currentAgent !== currentPreferredAgent) {
        setSelectedAgent(currentPreferredAgent);
      }
      return;
    }
    setSelectedAgent(currentPreferredAgent);
  };

  /**
   * @wisepen-manual-effect
   * 执行时机：外部注入的 Agent 集合或首选 Agent 变化时校正聊天输入 store。
   * 不可替代原因：选中 Agent 保存在独立 Zustand store，不能由当前组件 JSX 直接派生。
   * cleanup：没有订阅或异步任务，无需清理。
   */
  useEffect(syncPreferredAgent, [
    injectedAgentKey,
    injectedAgentsLatest,
    preferredAgentKey,
    preferredAgentLatest,
    setSelectedAgent,
    store,
  ]);

  const handleSelect = (agent: ChatAgentOption) => {
    setSelectedAgent(agent);
    setOpen(false);
  };

  const handleLoadMorePersonal = async () => {
    if (!personalPage || loadingMorePersonal) return;
    setLoadingMorePersonal(true);
    try {
      const page = await chatService.listChatInputAgents({
        scope: 'PERSONAL',
        page: personalPage.page + 1,
        size: personalPage.size,
      });
      setPersonalAgents((prev) => [...prev, ...page.list]);
      setPersonalPage(page);
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    } finally {
      setLoadingMorePersonal(false);
    }
  };

  const handleLoadMoreGroups = async () => {
    if (!groupPage || loadingMoreGroups) return;
    setLoadingMoreGroups(true);
    try {
      const page = await chatService.listChatInputGroups({
        page: groupPage.page + 1,
        size: groupPage.size,
      });
      setGroups((prev) => [...prev, ...page.list]);
      setGroupPage(page);
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    } finally {
      setLoadingMoreGroups(false);
    }
  };

  const handleGroupTreeLoadData = async (node: TreeDataNode) => {
    const key = String(node.key);
    if (!key.startsWith(GROUP_NODE_PREFIX)) return;
    const groupId = key.slice(GROUP_NODE_PREFIX.length);
    const group = groups.find((item) => item.groupId === groupId);
    if (!group) return;
    await loadGroupAgents(key, group, 1);
  };

  const handleGroupTreeSelect = (keys: Key[]) => {
    const selectedLoadMore = keys.map(String).find((key) => key.startsWith(LOAD_MORE_NODE_PREFIX));
    if (selectedLoadMore) {
      const [, ownerKey, pageText] = selectedLoadMore.match(/^load-more-agent:(.+):(\d+)$/) ?? [];
      const state = ownerKey ? groupStateMap[ownerKey] : undefined;
      const groupId = ownerKey?.slice(GROUP_NODE_PREFIX.length);
      const group = groups.find((item) => item.groupId === groupId);
      if (state && group) {
        void loadGroupAgents(ownerKey, group, Number(pageText)).catch((error) =>
          toast.danger(parseErrorMessage(error))
        );
      }
      return;
    }
    const selectedAgentId = keys
      .map(String)
      .find((key) =>
        Object.values(groupStateMap).some((state) =>
          state.items.some((agent) => agent.agentId === key)
        )
      );
    if (!selectedAgentId) return;
    const groupAgent = Object.values(groupStateMap)
      .flatMap((state) => state.items)
      .find((agent) => agent.agentId === selectedAgentId);
    if (groupAgent) {
      setSelectedAgent(groupAgent);
      setOpen(false);
    }
  };

  const getAgentLabel = (agent: ChatAgentOption): string =>
    agent.isDefault ? t('input.agentPicker.defaultAgent') : agent.label;

  return (
    <AppPopover isOpen={open} onOpenChange={setOpen}>
      <AppIconButton
        icon={<Bot size={17} aria-hidden="true" />}
        label={t('input.agentPicker.trigger')}
        tooltip={{ content: getAgentLabel(selectedAgent) }}
        overlayTrigger={<AppPopover.Trigger />}
      />
      <AppPopover.Content placement="top" title={t('input.agentPicker.title')}>
        <AppPopover.DeferredContent fallback={skeleton}>
          {() =>
            showSkeleton ? (
              skeleton
            ) : (
              <div className={`${styles.popoverPanel} ${styles.popoverPanelAgent}`}>
                <ListBox
                  aria-label={t('input.agentPicker.trigger')}
                  selectionMode="single"
                  selectedKeys={[selectedAgent.agentId]}
                  className={styles.listBox}
                >
                  {displayAgents.map((agent) => (
                    <ListBoxItem
                      key={agent.agentId}
                      id={agent.agentId}
                      textValue={getAgentLabel(agent)}
                      onPress={() => handleSelect(agent)}
                    >
                      <span className={styles.agentItem}>
                        <span className={styles.agentMain}>
                          <Bot size={14} />
                          <span>{getAgentLabel(agent)}</span>
                        </span>
                        {agent.source === 'CURRENT_DRAFT' ? (
                          <span className={styles.agentMeta}>
                            {t('input.agentPicker.currentDraft')}
                          </span>
                        ) : agent.agentType === 'GROUP' && agent.groupName ? (
                          <span className={styles.agentMeta}>{agent.groupName}</span>
                        ) : null}
                        {selectedAgent.agentId === agent.agentId ? (
                          <Check size={14} className={styles.checkIcon} />
                        ) : null}
                      </span>
                    </ListBoxItem>
                  ))}
                </ListBox>
                {hasMorePersonalAgents ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={styles.popoverLoadMore}
                    isDisabled={loadingMorePersonal}
                    onPress={handleLoadMorePersonal}
                  >
                    {t('session.loadMore')}
                  </Button>
                ) : null}
                {groups.length > 0 || loadingGroups ? (
                  <div className={styles.agentGroupTreeWrap}>
                    <Tree
                      treeData={groupTreeData}
                      className={styles.agentGroupTree}
                      selectedKeys={[selectedAgent.agentId]}
                      selectable
                      blockNode
                      loadData={handleGroupTreeLoadData}
                      onSelect={(keys) => handleGroupTreeSelect(keys)}
                    />
                    {hasMoreGroups ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={styles.popoverLoadMore}
                        isDisabled={loadingMoreGroups}
                        onPress={handleLoadMoreGroups}
                      >
                        {t('session.loadMore')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          }
        </AppPopover.DeferredContent>
      </AppPopover.Content>
    </AppPopover>
  );
}

export default AgentPicker;
