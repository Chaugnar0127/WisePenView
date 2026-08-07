import AppModal from '@/components/Overlay/AppModal';
import type { TreeDataNode } from '@/components/Tree';
import Tree from '@/components/Tree';
import { useChatService } from '@/domains';
import {
  buildDefaultPersonalAgent,
  type ChatAgentOption,
  type ChatInputResourceScope,
  type PageResult,
} from '@/domains/Chat';
import type { Group } from '@/domains/Group';
import type { ResourceSkillSummary } from '@/domains/Resource';
import { parseErrorMessage } from '@/utils/error';
import { Button, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { Folder } from 'lucide-react';
import type { Key } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useChatInputStore, useChatInputStoreApi } from '../_store/ChatInputStore';
import styles from './style.module.less';

const GROUP_PAGE_SIZE = 30;
const SKILL_PAGE_SIZE = 50;
const PERSONAL_NODE_KEY = 'personal';
const GROUP_NODE_PREFIX = 'group:';
const LOAD_MORE_NODE_PREFIX = 'load-more:';

interface SkillNodeState {
  scope: ChatInputResourceScope;
  groupId?: string;
  groupName?: string;
  items: ResourceSkillSummary[];
  page: number;
  totalPage: number;
}

function OtherSkillModal() {
  const open = useChatInputStore((state) => state.otherSkillModalOpen);
  if (!open) return null;
  return <OtherSkillModalContent />;
}

function OtherSkillModalContent() {
  const { t } = useTranslation(['chat', 'common']);
  const chatService = useChatService();
  const { currentAgent, selectedSkills } = useChatInputStore(
    useShallow((state) => ({
      currentAgent: state.selectedAgent,
      selectedSkills: state.selectedSkills,
    }))
  );
  const { replaceExternalSkills, setOtherSkillModalOpen } = useChatInputStoreApi().getState();
  const [selectedKeys, setSelectedKeys] = useState<Key[]>(() =>
    selectedSkills.filter((s) => s.external).map((s) => s.skillId)
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupPage, setGroupPage] = useState<PageResult<Group> | null>(null);
  const [loadingMoreGroups, setLoadingMoreGroups] = useState(false);
  const [skillStateMap, setSkillStateMap] = useState<Record<string, SkillNodeState>>({});
  const { loading } = useRequest(
    () => chatService.listChatInputGroups({ page: 1, size: GROUP_PAGE_SIZE }),
    {
      refreshDeps: [currentAgent.agentId],
      onBefore: () => {
        setGroups([]);
        setGroupPage(null);
        setSkillStateMap({});
      },
      onSuccess: (page) => {
        setGroups(page.list);
        setGroupPage(page);
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const buildSourceAgent = (ownerKey: string, state: SkillNodeState): ChatAgentOption | null => {
    if (ownerKey === PERSONAL_NODE_KEY) return buildDefaultPersonalAgent();
    if (!state.groupId) return null;
    return {
      agentId:
        currentAgent.groupId === state.groupId
          ? currentAgent.agentId
          : `agent-group-${state.groupId}`,
      agentType: 'GROUP',
      label: state.groupName ?? '',
      source: 'RESOURCE',
      groupId: state.groupId,
      groupName: state.groupName,
    };
  };

  const { skillMap, treeData } = (() => {
    const mapping = new Map<
      string,
      { skill: ResourceSkillSummary; sourceAgent: ChatAgentOption | null }
    >();

    const buildSkillChildren = (ownerKey: string): TreeDataNode[] | undefined => {
      const state = skillStateMap[ownerKey];
      if (!state) return undefined;
      const sourceAgent = buildSourceAgent(ownerKey, state);
      const children: TreeDataNode[] = state.items.map((skill) => {
        mapping.set(skill.skillId, { skill, sourceAgent });
        return {
          key: skill.skillId,
          title: skill.displayName,
          isLeaf: true,
        };
      });
      if (state.page < state.totalPage) {
        children.push({
          key: `${LOAD_MORE_NODE_PREFIX}${ownerKey}:${state.page + 1}`,
          title: t('session.loadMore'),
          isLeaf: true,
        });
      }
      return children;
    };

    const nodes: TreeDataNode[] = [];
    if (currentAgent.agentType === 'GROUP') {
      nodes.push({
        key: PERSONAL_NODE_KEY,
        title: (
          <span className={styles.nodeTitle}>
            <Folder size={14} color="var(--resource-icon-folder)" />
            <span>{t('input.otherSkillPicker.personal')}</span>
          </span>
        ),
        selectable: false,
        isLeaf: false,
        children: buildSkillChildren(PERSONAL_NODE_KEY),
      });
    }

    groups
      .filter((group) => group.groupId !== currentAgent.groupId)
      .forEach((group) => {
        const ownerKey = `${GROUP_NODE_PREFIX}${group.groupId}`;
        const groupLabel = group.groupName || t('input.otherSkillPicker.group');
        nodes.push({
          key: ownerKey,
          title: (
            <span className={styles.nodeTitle}>
              <Folder size={14} color="var(--resource-icon-folder)" />
              <span>{groupLabel}</span>
            </span>
          ),
          selectable: false,
          isLeaf: false,
          children: buildSkillChildren(ownerKey),
        });
      });

    return { skillMap: mapping, treeData: nodes };
  })();

  const loadSkillPage = async (
    ownerKey: string,
    scope: ChatInputResourceScope,
    page: number,
    group?: Pick<Group, 'groupId' | 'groupName'>
  ) => {
    const result = await chatService.listChatInputSkills({
      scope,
      groupId: group?.groupId,
      groupName: group?.groupName,
      page,
      size: SKILL_PAGE_SIZE,
    });
    setSkillStateMap((prev) => {
      const current = prev[ownerKey];
      return {
        ...prev,
        [ownerKey]: {
          scope,
          groupId: group?.groupId,
          groupName: group?.groupName,
          items: page === 1 || !current ? result.list : [...current.items, ...result.list],
          page: result.page,
          totalPage: result.totalPage,
        },
      };
    });
  };

  const handleLoadData = async (node: TreeDataNode) => {
    const nodeKey = String(node.key);
    if (nodeKey === PERSONAL_NODE_KEY) {
      await loadSkillPage(PERSONAL_NODE_KEY, 'PERSONAL', 1);
      return;
    }
    if (!nodeKey.startsWith(GROUP_NODE_PREFIX)) return;
    const groupId = nodeKey.slice(GROUP_NODE_PREFIX.length);
    const group = groups.find((item) => item.groupId === groupId);
    if (!group) return;
    await loadSkillPage(nodeKey, 'GROUP', 1, group);
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
    const latestKey = keys.map(String).find((key) => key.startsWith(LOAD_MORE_NODE_PREFIX));
    if (latestKey) {
      const [, ownerKey, pageText] = latestKey.match(/^load-more:(.+):(\d+)$/) ?? [];
      const state = ownerKey ? skillStateMap[ownerKey] : undefined;
      if (state) {
        void loadSkillPage(
          ownerKey,
          state.scope,
          Number(pageText),
          state.groupId ? { groupId: state.groupId, groupName: state.groupName ?? '' } : undefined
        ).catch((error) => toast.danger(parseErrorMessage(error)));
      }
      return;
    }
    setSelectedKeys(keys);
  };

  const hasMoreGroups = groupPage != null && groupPage.page < groupPage.totalPage;

  function handleClose(): void {
    setOtherSkillModalOpen(false);
  }

  const handleOpenChange = (visible: boolean) => {
    if (!visible) handleClose();
  };

  const handleConfirm = () => {
    const selected = selectedKeys.map((key) => skillMap.get(String(key))).filter(Boolean) as Array<{
      skill: ResourceSkillSummary;
      sourceAgent: ChatAgentOption | null;
    }>;
    replaceExternalSkills(selected);
    handleClose();
  };

  return (
    <AppModal
      isOpen
      onOpenChange={handleOpenChange}
      title={t('input.otherSkillPicker.title')}
      size="md"
      contentMode="dialog"
    >
      <AppModal.DeferredContent
        fallback={
          <AppModal.Body>
            <div className={styles.wrapper}>
              <div className={styles.hint}>{t('input.otherSkillPicker.hint')}</div>
              <div className={styles.treeNav} />
            </div>
          </AppModal.Body>
        }
      >
        {() => (
          <AppModal.Body>
            <div className={styles.wrapper}>
              <div className={styles.hint}>{t('input.otherSkillPicker.hint')}</div>
              <div className={styles.treeNav}>
                {loading ? (
                  <div className={styles.hint}>{t('input.otherSkillPicker.loading')}</div>
                ) : (
                  <Tree
                    treeData={treeData}
                    className={styles.tree}
                    multiple
                    selectedKeys={selectedKeys}
                    blockNode
                    loadData={handleLoadData}
                    onSelect={(keys: Key[]) => handleSelectKeys(keys)}
                  />
                )}
                {!loading && hasMoreGroups ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={styles.loadMoreButton}
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
      <AppModal.Footer>
        <Button variant="secondary" onPress={handleClose}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>
        <Button variant="primary" onPress={handleConfirm}>
          {t('actions.confirm', { ns: 'common' })}
        </Button>
      </AppModal.Footer>
    </AppModal>
  );
}

export default OtherSkillModal;
