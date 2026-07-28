import { useAgentService, useChatService, useSkillService } from '@/domains';
import type { AgentAsset, AgentDetail, AgentSpec } from '@/domains/Agent';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import type { PromptMode } from '../_components/SystemPromptSection';
import { loadAgentEditorData } from '../_services/agentEditorDataService';
import {
  buildAgentDraft,
  buildCurrentDraftAgent,
  getAgentVersionItems,
  snapshotAgentDraft,
  type AgentDraft,
} from '../agentWorkspaceModel';
import { parseGuidedPrompt } from '../systemPrompt';

export type { AgentDraft } from '../agentWorkspaceModel';
export type AgentSavePhase = 'clean' | 'dirty' | 'saving' | 'failed';

interface UseAgentWorkspaceControllerOptions {
  resourceId?: string;
  t: TFunction<'agent' | 'common'>;
}

export function useAgentWorkspaceController({ resourceId, t }: UseAgentWorkspaceControllerOptions) {
  const agentService = useAgentService();
  const chatService = useChatService();
  const skillService = useSkillService();
  const [draft, setDraftState] = useState<AgentDraft | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [savePhase, setSavePhase] = useState<AgentSavePhase>('clean');
  const [promptMode, setPromptMode] = useState<PromptMode>('guided');
  const [assetOverride, setAssetOverride] = useState<AgentAsset[] | null>(null);
  const [agentOverride, setAgentOverride] = useState<AgentDetail | null>(null);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const isDirty = savePhase === 'dirty' || savePhase === 'failed';

  const initialize = (agent: AgentDetail, savedDraft?: AgentDraft) => {
    const nextDraft = buildAgentDraft(agent);
    const saved = savedDraft ?? nextDraft;
    setDraftState(nextDraft);
    setSavedSnapshot(snapshotAgentDraft(saved));
    setSavePhase(snapshotAgentDraft(nextDraft) === snapshotAgentDraft(saved) ? 'clean' : 'dirty');
  };

  const setDraft = (updater: (current: AgentDraft) => AgentDraft) =>
    setDraftState((current) => {
      if (!current) return current;
      const next = updater(current);
      setSavePhase(snapshotAgentDraft(next) === savedSnapshot ? 'clean' : 'dirty');
      return next;
    });

  const load = useRequest(
    async () => {
      if (!resourceId) return null;
      return loadAgentEditorData({ resourceId, agentService, chatService, skillService });
    },
    {
      ready: Boolean(resourceId),
      refreshDeps: [resourceId],
      onSuccess: (data) => {
        if (!data) return;
        setAssetOverride(null);
        setAgentOverride(null);
        setViewingVersion(null);
        initialize(data.agent, data.savedDraft);
        setPromptMode(
          parseGuidedPrompt(data.agent.spec.systemPrompt).compatible ? 'guided' : 'free'
        );
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const { loading: versionLoading, run: runSwitchVersion } = useRequest(
    async (version: number) => {
      if (!resourceId) return null;
      return agentService.getAgentDetail(resourceId, version);
    },
    {
      manual: true,
      onSuccess: (agent, params) => {
        if (!agent) return;
        const version = params[0];
        const isDraft = load.data?.agent.draftVersion === version;
        setViewingVersion(isDraft ? null : version);
        setAgentOverride(agent);
        setAssetOverride(null);
        initialize(agent);
        setPromptMode(parseGuidedPrompt(agent.spec.systemPrompt).compatible ? 'guided' : 'free');
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const save = useRequest(
    async () => {
      if (!resourceId || !draft || !load.data || viewingVersion !== null) return;
      setSavePhase('saving');
      await Promise.all([
        agentService.updateAgentInfo(resourceId, draft.name.trim(), draft.description.trim()),
        agentService.updateAgentSpec(resourceId, load.data.agent.draftVersion, draft.spec),
      ]);
    },
    {
      manual: true,
      onSuccess: () => {
        if (draft) setSavedSnapshot(snapshotAgentDraft(draft));
        setSavePhase('clean');
        toast.success(t('agent:page.saved'));
      },
      onError: (error) => {
        setSavePhase('failed');
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const publish = useRequest(
    async () => {
      if (!resourceId) return;
      if (isDirty) await save.runAsync();
      await agentService.publishVersion(resourceId);
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('agent:page.published'));
        load.refresh();
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const refreshAssets = async () => {
    if (!resourceId) return;
    try {
      const latest = await agentService.getAgentDetail(resourceId);
      setAssetOverride(latest.assets);
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    }
  };

  const upload = useRequest(
    async (files: File[]) => {
      if (!resourceId || !load.data) return;
      for (const file of files) {
        await agentService.uploadAsset(resourceId, load.data.agent.draftVersion, { file });
      }
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('agent:page.assetUploaded'));
        void refreshAssets();
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const remove = useRequest(
    async (assetId: string) => {
      if (!resourceId || !load.data) return;
      await agentService.deleteAssets(resourceId, load.data.agent.draftVersion, [assetId]);
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('agent:page.assetDeleted'));
        void refreshAssets();
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const blocker = useBlocker(isDirty);
  useBeforeUnload((event) => {
    if (isDirty) event.preventDefault();
  });

  const handleSaveAndLeave = async () => {
    try {
      await save.runAsync();
      blocker.proceed?.();
    } catch {
      // 保存失败时保留当前页面，用户可以继续编辑。
    }
  };
  const setSpec = (spec: AgentSpec) => setDraft((current) => ({ ...current, spec }));
  const requestPromptMode = (mode: PromptMode): 'switch' | 'confirmReset' | undefined => {
    if (mode === promptMode) return undefined;
    if (mode === 'free' || (draft && parseGuidedPrompt(draft.spec.systemPrompt).compatible)) {
      setPromptMode(mode);
      return 'switch';
    }
    return 'confirmReset';
  };
  const saveDraftForDebug = async (): Promise<boolean> => {
    try {
      await save.runAsync();
      return true;
    } catch {
      return false;
    }
  };
  const handleVersionSelect = (version: number) => {
    if (!load.data || version === (viewingVersion ?? load.data.agent.draftVersion)) return;
    if (isDirty) {
      toast.warning(t('agent:page.switchVersionBlocked'));
      return;
    }
    runSwitchVersion(version);
  };

  const displayAgent = agentOverride ?? load.data?.agent;
  const versionItems = getAgentVersionItems(load.data?.agent, viewingVersion);
  const disabledVersionKeys = load.data?.agent.isOwner
    ? new Set<string>()
    : new Set(versionItems.map((item) => item.key));
  const currentDraftAgent = buildCurrentDraftAgent(load.data?.agent, draft, t);
  const isReadOnly =
    !load.data?.agent.isOwner ||
    viewingVersion !== null ||
    save.loading ||
    publish.loading ||
    versionLoading;

  return {
    agentOverride,
    assets: assetOverride ?? displayAgent?.assets ?? [],
    blocker,
    currentDraftAgent,
    disabledVersionKeys,
    displayAgent,
    draft,
    handleSaveAndLeave,
    handleVersionSelect,
    isDirty,
    isReadOnly,
    load,
    promptMode,
    publish,
    remove,
    requestPromptMode,
    save,
    saveDraftForDebug,
    savePhase,
    setDraft,
    setPromptMode,
    setSpec,
    upload,
    versionItems,
    versionLoading,
    viewingVersion,
  };
}
