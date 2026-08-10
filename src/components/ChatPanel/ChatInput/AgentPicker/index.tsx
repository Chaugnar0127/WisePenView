import AppIconButton from '@/components/Button/AppIconButton';
import { AppModal, AppPopover } from '@/components/Overlay';
import type { TreeDataNode } from '@/components/Tree';
import Tree from '@/components/Tree';
import { useChatService } from '@/domains';
import { buildDefaultPersonalAgent, type ChatAgentOption, type PageResult } from '@/domains/Chat';
import type { Group } from '@/domains/Group';
import { parseErrorMessage } from '@/utils/error';
import { Button, ListBox, Skeleton, toast } from '@heroui/react';
import { useInfiniteScroll, useLatest, useRequest } from 'ahooks';
import { Bot, Folder } from 'lucide-react';
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

interface AgentPageState extends PageResult<ChatAgentOption> {
  list: ChatAgentOption[];
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
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const {
    data: personalPage,
    loading: loadingPersonal,
    loadingMore: loadingMorePersonal,
    noMore: noMorePersonal,
    loadMore: loadMorePersonal,
  } = useInfiniteScroll<AgentPageState>(
    async (current) =>
      chatService.listChatInputAgents({
        scope: 'PERSONAL',
        page: Math.floor((current?.list.length ?? 0) / AGENT_PAGE_SIZE) + 1,
        size: AGENT_PAGE_SIZE,
      }),
    {
      manual: !open,
      reloadDeps: [open],
      isNoMore: (page) => Boolean(page && (page.total === 0 || page.list.length >= page.total)),
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const showSkeleton = personalPage == null && loadingPersonal;
  const personalAgents = personalPage?.list ?? [];
  const displayAgents = mergeAgentOptions(
    [buildDefaultPersonalAgent(), selectedAgent, ...personalAgents],
    injectedAgents
  );
  const hasMorePersonalAgents = Boolean(personalPage) && !noMorePersonal;
  const injectedAgentKey = JSON.stringify(injectedAgents ?? []);
  const preferredAgentKey = JSON.stringify(preferredAgent ?? null);
  const injectedAgentsLatest = useLatest(injectedAgents);
  const preferredAgentLatest = useLatest(preferredAgent);
  const skeleton = <AgentMenuSkeleton ariaLabel={t('input.agentPicker.loadingAria')} />;

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

  const handleOpenGroupModal = () => {
    setOpen(false);
    setGroupModalOpen(true);
  };

  const getAgentLabel = (agent: ChatAgentOption): string =>
    agent.isDefault ? t('input.agentPicker.defaultAgent') : agent.label;

  const handleMenuAction = (key: Key) => {
    const agent = displayAgents.find((item) => item.agentId === key);
    if (agent) {
      handleSelect(agent);
    }
  };

  return (
    <>
      <AppPopover isOpen={open} onOpenChange={setOpen}>
        <AppIconButton
          icon={<Bot size={17} aria-hidden="true" />}
          label={t('input.agentPicker.trigger')}
          tooltip={{ content: getAgentLabel(selectedAgent) }}
          overlayTrigger={<AppPopover.Trigger />}
        />
        <AppPopover.Content
          placement="top"
          title={t('input.agentPicker.title')}
          bodyPadding="none"
          classNames={{ header: styles.compactPopoverHeader }}
        >
          {showSkeleton ? (
            skeleton
          ) : (
            <div className={styles.popoverPanelAgent}>
              <ListBox
                aria-label={t('input.agentPicker.trigger')}
                selectionMode="single"
                selectedKeys={new Set([selectedAgent.agentId])}
                className={styles.listBox}
                onAction={handleMenuAction}
              >
                {displayAgents.map((agent) => {
                  const description =
                    agent.source === 'CURRENT_DRAFT'
                      ? t('input.agentPicker.currentDraft')
                      : agent.agentType === 'GROUP' && agent.groupName
                        ? agent.groupName
                        : null;
                  return (
                    <ListBox.Item
                      key={agent.agentId}
                      id={agent.agentId}
                      textValue={getAgentLabel(agent)}
                      className={styles.listBoxItem}
                    >
                      <span className={styles.listItemContent}>
                        <span className={styles.listItemLeading}>
                          <Bot size={14} aria-hidden="true" />
                        </span>
                        <span className={styles.listItemText}>
                          <span className={styles.listItemLabel}>{getAgentLabel(agent)}</span>
                          {description ? (
                            <span className={styles.listItemDescription}>{description}</span>
                          ) : null}
                        </span>
                        <ListBox.ItemIndicator />
                      </span>
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </div>
          )}
          {hasMorePersonalAgents ? (
            <Button
              size="sm"
              variant="ghost"
              className={styles.popoverLoadMore}
              isDisabled={loadingMorePersonal}
              onPress={loadMorePersonal}
            >
              {t('session.loadMore')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className={styles.agentGroupAction}
            onPress={handleOpenGroupModal}
          >
            <span className={styles.agentGroupTitle}>
              <Folder size={14} color="var(--resource-icon-folder)" />
              <span>{t('input.agentPicker.selectFromGroup')}</span>
            </span>
          </Button>
        </AppPopover.Content>
      </AppPopover>
      <GroupAgentPickerModal
        open={groupModalOpen}
        selectedAgentId={selectedAgent.agentId}
        onOpenChange={setGroupModalOpen}
        onSelect={setSelectedAgent}
      />
    </>
  );
}

interface GroupAgentPickerModalProps {
  open: boolean;
  selectedAgentId: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (agent: ChatAgentOption) => void;
}

function GroupAgentPickerModal({
  open,
  selectedAgentId,
  onOpenChange,
  onSelect,
}: GroupAgentPickerModalProps) {
  if (!open) return null;
  return (
    <GroupAgentPickerModalContent
      selectedAgentId={selectedAgentId}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
    />
  );
}

function GroupAgentPickerModalContent({
  selectedAgentId,
  onOpenChange,
  onSelect,
}: Omit<GroupAgentPickerModalProps, 'open'>) {
  const { t } = useTranslation(['chat', 'common']);
  const chatService = useChatService();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupPage, setGroupPage] = useState<PageResult<Group> | null>(null);
  const [loadingMoreGroups, setLoadingMoreGroups] = useState(false);
  const [groupStateMap, setGroupStateMap] = useState<Record<string, AgentGroupState>>({});
  const { loading } = useRequest(
    () => chatService.listChatInputGroups({ page: 1, size: GROUP_PAGE_SIZE }),
    {
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

  const buildGroupNodeTitle = (groupName: string) => (
    <span className={styles.agentGroupTitle}>
      <Folder size={14} color="var(--resource-icon-folder)" />
      <span>{groupName || t('input.agentPicker.groupFallback')}</span>
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

  const handleLoadData = async (node: TreeDataNode) => {
    const key = String(node.key);
    if (!key.startsWith(GROUP_NODE_PREFIX)) return;
    const groupId = key.slice(GROUP_NODE_PREFIX.length);
    const group = groups.find((item) => item.groupId === groupId);
    if (!group) return;
    await loadGroupAgents(key, group, 1);
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

  const handleSelectKeys = (keys: Key[]) => {
    const selectedLoadMore = keys.map(String).find((key) => key.startsWith(LOAD_MORE_NODE_PREFIX));
    if (selectedLoadMore) {
      const [, ownerKey, pageText] = selectedLoadMore.match(/^load-more-agent:(.+):(\d+)$/) ?? [];
      const state = ownerKey ? groupStateMap[ownerKey] : undefined;
      if (state) {
        void loadGroupAgents(
          ownerKey,
          { groupId: state.groupId, groupName: state.groupName },
          Number(pageText)
        ).catch((error) => toast.danger(parseErrorMessage(error)));
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
    if (!groupAgent) return;
    onSelect(groupAgent);
    onOpenChange(false);
  };

  const hasMoreGroups = groupPage != null && groupPage.page < groupPage.totalPage;

  return (
    <AppModal
      isOpen
      onOpenChange={onOpenChange}
      title={t('input.agentPicker.groupModalTitle')}
      size="md"
      contentMode="dialog"
      footer={false}
    >
      <AppModal.DeferredContent
        fallback={
          <AppModal.Body>
            <div className={styles.agentGroupModalBody}>
              <div className={styles.agentGroupModalHint}>{t('input.agentPicker.groupHint')}</div>
              <div className={styles.agentGroupModalTree} />
            </div>
          </AppModal.Body>
        }
      >
        {() => (
          <AppModal.Body>
            <div className={styles.agentGroupModalBody}>
              <div className={styles.agentGroupModalHint}>{t('input.agentPicker.groupHint')}</div>
              <div className={styles.agentGroupModalTree}>
                {loading ? (
                  <div className={styles.agentGroupModalHint}>
                    {t('input.agentPicker.groupLoading')}
                  </div>
                ) : (
                  <Tree
                    treeData={groupTreeData}
                    className={styles.agentGroupTree}
                    selectedKeys={[selectedAgentId]}
                    selectable
                    blockNode
                    loadData={handleLoadData}
                    onSelect={(keys) => handleSelectKeys(keys)}
                  />
                )}
                {!loading && hasMoreGroups ? (
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
            </div>
          </AppModal.Body>
        )}
      </AppModal.DeferredContent>
    </AppModal>
  );
}

export default AgentPicker;
