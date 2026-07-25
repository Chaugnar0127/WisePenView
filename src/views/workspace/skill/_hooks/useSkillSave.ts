import type {
  ISkillService,
  SkillDetail,
  SkillFileNode,
  UploadSkillAssetResult,
} from '@/domains/Skill';
import { useEffectForce } from '@/hooks/useEffectForce';
import i18n from '@/i18n';
import { createClientError, FRONTEND_CLIENT_ERROR, parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SkillSaveQueueItem } from '../_components/SkillSaveQueueDock/index.type';
import {
  clearSkillDraftCache,
  loadSkillDraftCache,
  saveSkillDraftCache,
} from '../utils/skillDraftCache';
import {
  canPreviewSkillFile,
  collectLocalAssetNodes,
  isLocalAssetNode,
  updateSavedTreeFile,
  updateTreeFileContent,
} from '../utils/skillFileTree';
import {
  resolveSkillEditorSavePhase,
  type SkillEditorActions,
  type SkillEditorState,
} from './useSkillEditorController';

interface SaveAssetOptions {
  refresh?: boolean;
  showToast?: boolean;
}

interface SaveSkillConfigOptions {
  showToast?: boolean;
}

interface SaveSkillFileTarget {
  file: SkillFileNode;
  content: string | Blob;
}

interface UseSkillSaveOptions {
  actions: SkillEditorActions;
  canEdit: boolean;
  refreshSkill: () => void;
  selectedFile: SkillFileNode | null;
  skill?: SkillDetail;
  skillService: ISkillService;
  state: SkillEditorState;
}

interface RestoredEditorDraft {
  fileId: string;
  editorContent: string;
  savedContent: string;
}

export function useSkillSave({
  actions,
  canEdit,
  refreshSkill,
  selectedFile,
  skill,
  skillService,
  state,
}: UseSkillSaveOptions) {
  const { t } = useTranslation('skill');
  const draftCacheWriteVersionRef = useRef(0);
  const restoredEditorDraftRef = useRef<RestoredEditorDraft | null>(null);
  const [draftCacheReady, setDraftCacheReady] = useState(false);
  const {
    configDescription,
    configName,
    editorContent,
    files,
    pendingIntent,
    savedConfigDescription,
    savedConfigName,
    savedContent,
    saveQueueItems,
    selectedFileId,
    selectedTreeNodeId,
    viewingVersion,
  } = state;
  const {
    discardLocalChanges,
    initialize,
    restoreDraft,
    setConfigDescription,
    setConfigName,
    setEditing,
    setFiles,
    setPendingIntent,
    setSavedConfigDescription,
    setSavedConfigName,
    setSavedContent,
    setSaveQueueItems,
    setSelectedFileId,
    setSelectedTreeNodeId,
  } = actions;

  const invalidateDraftCacheWrites = useCallback(() => {
    draftCacheWriteVersionRef.current += 1;
  }, []);

  const clearDraftCache = useCallback(
    (targetResourceId: string) => {
      invalidateDraftCacheWrites();
      return clearSkillDraftCache(targetResourceId).catch(() => undefined);
    },
    [invalidateDraftCacheWrites]
  );

  /**
   * Skill 详情变化时重建编辑状态并异步恢复同一草稿版本；cleanup 防止旧资源恢复结果覆盖新页面。
   */
  useEffectForce(() => {
    if (!skill) return;
    let disposed = false;

    invalidateDraftCacheWrites();
    setDraftCacheReady(false);
    initialize(skill);

    void loadSkillDraftCache(skill.resourceId)
      .then((snapshot) => {
        if (disposed) return;
        if (!snapshot || snapshot.draftVersion !== skill.draftVersion) {
          setDraftCacheReady(true);
          return;
        }
        restoredEditorDraftRef.current = snapshot.selectedFileId
          ? {
              fileId: snapshot.selectedFileId,
              editorContent: snapshot.editorContent,
              savedContent: snapshot.savedContent,
            }
          : null;
        restoreDraft(snapshot, skill);
        setDraftCacheReady(true);
        toast.warning(i18n.t('toast.draftRestored', { ns: 'skill' }));
      })
      .catch(() => {
        if (!disposed) setDraftCacheReady(true);
      });

    return () => {
      disposed = true;
    };
  }, [initialize, invalidateDraftCacheWrites, restoreDraft, skill]);

  const localAssetNodes = useMemo(() => collectLocalAssetNodes(files), [files]);
  const isDirty = canEdit && editorContent !== savedContent;
  const isConfigDirty =
    canEdit && (configName !== savedConfigName || configDescription !== savedConfigDescription);
  const hasConfigValuesMissing =
    configName.trim().length === 0 || configDescription.trim().length === 0;
  const hasSavedConfigMissing =
    savedConfigName.trim().length === 0 || savedConfigDescription.trim().length === 0;
  const hasMissingConfig = canEdit && hasConfigValuesMissing;
  const hasUnsavedLocalAssets = canEdit && localAssetNodes.length > 0;
  const hasFailedSaveItems = saveQueueItems.some((item) => item.phase === 'failed');
  const hasSaveableChanges = isDirty || hasUnsavedLocalAssets || hasFailedSaveItems;
  const isSaveQueueActive = saveQueueItems.some(
    (item) => item.phase === 'preparing' || item.phase === 'uploading'
  );
  const hasUnsavedSkillChanges =
    canEdit && (isDirty || hasUnsavedLocalAssets || hasFailedSaveItems);
  const hasUnsafeNavigation = hasUnsavedSkillChanges || isConfigDirty || isSaveQueueActive;
  const hasRecoverableDraft = hasUnsavedSkillChanges || isConfigDirty;
  const pendingLocalSaveQueueItems = useMemo<SkillSaveQueueItem[]>(
    () =>
      localAssetNodes.map((file) => ({
        id: file.id,
        name: file.name,
        path: file.path,
        size: file.size,
        phase: 'pending',
        progress: 0,
      })),
    [localAssetNodes]
  );
  const visibleSaveQueueItems =
    saveQueueItems.length > 0 ? saveQueueItems : pendingLocalSaveQueueItems;

  /**
   * 可恢复草稿包含本地 Blob，必须随编辑状态防抖写入 IndexedDB；cleanup 取消过期写入。
   */
  useEffectForce(() => {
    if (!skill || !draftCacheReady || !canEdit || !hasRecoverableDraft) return;
    const cacheWriteVersion = draftCacheWriteVersionRef.current;
    const timer = window.setTimeout(() => {
      if (draftCacheWriteVersionRef.current !== cacheWriteVersion) return;
      const filesForCache =
        selectedFile && canPreviewSkillFile(selectedFile)
          ? updateTreeFileContent(files, selectedFile.id, editorContent)
          : files;
      const cacheToken = `${skill.resourceId}:${cacheWriteVersion}:${Date.now()}`;
      const snapshot = {
        resourceId: skill.resourceId,
        draftVersion: skill.draftVersion,
        cacheToken,
        files: filesForCache,
        selectedFileId,
        selectedTreeNodeId,
        editorContent,
        savedContent,
        viewingVersion,
        saveQueueItems,
        configName,
        configDescription,
        savedConfigName,
        savedConfigDescription,
        updatedAt: Date.now(),
      };
      void saveSkillDraftCache(snapshot)
        .then(() => {
          if (draftCacheWriteVersionRef.current === cacheWriteVersion) return;
          void loadSkillDraftCache(snapshot.resourceId)
            .then((cachedSnapshot) => {
              if (cachedSnapshot?.cacheToken === cacheToken) {
                void clearSkillDraftCache(snapshot.resourceId);
              }
            })
            .catch(() => undefined);
        })
        .catch(() => {
          // IndexedDB 失败不阻断页面编辑，只是不提供本地草稿恢复。
        });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    canEdit,
    configDescription,
    configName,
    draftCacheReady,
    editorContent,
    files,
    hasRecoverableDraft,
    saveQueueItems,
    savedConfigDescription,
    savedConfigName,
    savedContent,
    selectedFile,
    selectedFileId,
    selectedTreeNodeId,
    skill,
    viewingVersion,
  ]);

  /**
   * 草稿回到干净状态后清除 IndexedDB 快照，避免再次进入页面恢复过期内容。
   */
  useEffectForce(() => {
    if (!skill || !draftCacheReady || hasRecoverableDraft) return;
    void clearDraftCache(skill.resourceId);
  }, [clearDraftCache, draftCacheReady, hasRecoverableDraft, skill]);

  const consumeRestoredEditorDraft = useCallback((fileId: string) => {
    const restoredDraft = restoredEditorDraftRef.current;
    if (!restoredDraft || restoredDraft.fileId !== fileId) return null;
    restoredEditorDraftRef.current = null;
    return restoredDraft;
  }, []);

  const buildAllSaveTargets = useCallback((): SaveSkillFileTarget[] => {
    if (!canEdit) return [];
    const targetMap = new Map<string, SaveSkillFileTarget>();

    localAssetNodes.forEach((file) => {
      targetMap.set(file.id, {
        file,
        content: file.contentBlob ?? file.content ?? '',
      });
    });

    if (selectedFile && isDirty) {
      targetMap.set(selectedFile.id, {
        file: selectedFile,
        content: editorContent,
      });
    }

    return [...targetMap.values()];
  }, [canEdit, editorContent, isDirty, localAssetNodes, selectedFile]);

  const buildCurrentSaveTarget = useCallback((): SaveSkillFileTarget[] => {
    if (!selectedFile || !canEdit) return [];
    if (!isDirty && !isLocalAssetNode(selectedFile)) return [];
    if (!canPreviewSkillFile(selectedFile)) {
      if (!isLocalAssetNode(selectedFile) || !selectedFile.contentBlob) return [];
      return [{ file: selectedFile, content: selectedFile.contentBlob }];
    }
    return [{ file: selectedFile, content: editorContent }];
  }, [canEdit, editorContent, isDirty, selectedFile]);

  const { loading: saveLoading, runAsync: runSaveTargetsAsync } = useRequest(
    async (targets: SaveSkillFileTarget[], options?: SaveAssetOptions) => {
      if (!skill || targets.length === 0) return { options };

      setSaveQueueItems(
        targets.map(({ file }) => ({
          id: file.id,
          name: file.name,
          path: file.path,
          size: file.size,
          phase: 'preparing',
          progress: 0,
        }))
      );

      const currentSelectedFileId = selectedFile?.id;
      let results: UploadSkillAssetResult[];
      try {
        results = await skillService.uploadAssets(
          skill.resourceId,
          skill.draftVersion,
          targets.map(({ file, content }) => ({
            clientId: file.id,
            name: file.name,
            path: file.path,
            content,
            size: file.size,
          })),
          {
            onProgress: ({ clientId, progress }) => {
              setSaveQueueItems((current) =>
                current.map((item) =>
                  item.id === clientId ? { ...item, phase: 'uploading', progress } : item
                )
              );
            },
          }
        );
      } catch (error) {
        const errorMessage = parseErrorMessage(error);
        setSaveQueueItems((current) =>
          current.map((item) =>
            item.phase === 'preparing' || item.phase === 'uploading'
              ? { ...item, phase: 'failed', errorMessage }
              : item
          )
        );
        throw error;
      }

      const targetById = new Map(targets.map((target) => [target.file.id, target]));
      const resultById = new Map(results.map((result) => [result.clientId, result]));
      const failedResults = results.filter((result) => result.error);
      const successResults = results.filter((result) => !result.error);

      if (successResults.length > 0) {
        setFiles((current) =>
          successResults.reduce((tree, result) => {
            const target = targetById.get(result.clientId);
            if (!target) return tree;
            return updateSavedTreeFile(
              tree,
              target.file.id,
              target.content,
              result.assetId,
              result.objectKey
            );
          }, current)
        );

        successResults.forEach((result) => {
          const assetId = result.assetId;
          if (!assetId) return;
          setSelectedFileId((current) => (current === result.clientId ? assetId : current));
          setSelectedTreeNodeId((current) => (current === result.clientId ? assetId : current));
          if (pendingIntent?.type === 'switchFile' && pendingIntent.fileId === result.clientId) {
            setPendingIntent({ type: 'switchFile', fileId: assetId });
          }
        });

        const selectedTarget = currentSelectedFileId ? targetById.get(currentSelectedFileId) : null;
        const selectedResult = currentSelectedFileId ? resultById.get(currentSelectedFileId) : null;
        if (
          selectedTarget &&
          selectedResult &&
          !selectedResult.error &&
          typeof selectedTarget.content === 'string'
        ) {
          setSavedContent(selectedTarget.content);
        }
      }

      setSaveQueueItems((current) =>
        current.map((item) => {
          const result = resultById.get(item.id);
          if (!result) {
            return item.phase === 'preparing' || item.phase === 'uploading'
              ? { ...item, phase: 'failed', errorMessage: t('queue.resultMissing') }
              : item;
          }
          if (result.error) {
            return {
              ...item,
              phase: 'failed',
              errorMessage: parseErrorMessage(result.error),
            };
          }
          return { ...item, phase: 'done', progress: 100 };
        })
      );

      if (failedResults.length > 0) {
        throw createClientError(FRONTEND_CLIENT_ERROR.SKILL_BATCH_SAVE_FAILED, {
          failedCount: failedResults.length,
        });
      }

      return { options };
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (!result) return;
        setSaveQueueItems([]);
        setEditing(false);
        if (skill) void clearDraftCache(skill.resourceId);
        if (result.options?.showToast !== false) toast.success(t('toast.saveSuccess'));
        if (result.options?.refresh === true) refreshSkill();
      },
      onError: (error) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const saveTargets = useCallback(
    async (targets: SaveSkillFileTarget[], options?: SaveAssetOptions) => {
      if (targets.length === 0) {
        setSaveQueueItems((current) =>
          current.some((item) => item.phase === 'failed') ? [] : current
        );
        return;
      }
      await runSaveTargetsAsync(targets, options);
    },
    [runSaveTargetsAsync, setSaveQueueItems]
  );

  const { loading: configLoading, runAsync: runUpdateConfigAsync } = useRequest(
    async (options?: SaveSkillConfigOptions) => {
      if (!skill) return null;
      const name = configName.trim();
      const description = configDescription.trim();
      if (!name || !description) {
        throw createClientError(FRONTEND_CLIENT_ERROR.SKILL_CONFIG_REQUIRED);
      }
      await skillService.updateSkillInfo(skill.resourceId, name, description);
      return { name, description, options };
    },
    {
      manual: true,
      onSuccess: (result) => {
        if (!result) return;
        setConfigName(result.name);
        setConfigDescription(result.description);
        setSavedConfigName(result.name);
        setSavedConfigDescription(result.description);
        if (result.options?.showToast !== false) toast.success(t('toast.configUpdated'));
      },
      onError: (error) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const savePendingChanges = useCallback(
    async (options?: SaveAssetOptions & SaveSkillConfigOptions) => {
      if (isConfigDirty) await runUpdateConfigAsync(options);
      await saveTargets(buildAllSaveTargets(), options);
    },
    [buildAllSaveTargets, isConfigDirty, runUpdateConfigAsync, saveTargets]
  );

  const saveCurrentFile = useCallback(
    async (options?: SaveAssetOptions) => {
      if (!canEdit) return;
      await saveTargets(buildCurrentSaveTarget(), options);
    },
    [buildCurrentSaveTarget, canEdit, saveTargets]
  );

  const handleSave = useCallback(() => {
    if (!canEdit) return;
    void saveTargets(buildAllSaveTargets());
  }, [buildAllSaveTargets, canEdit, saveTargets]);

  const resetConfigDraft = useCallback(() => {
    setConfigName(savedConfigName);
    setConfigDescription(savedConfigDescription);
  }, [savedConfigDescription, savedConfigName, setConfigDescription, setConfigName]);

  const discardLocalSkillChanges = useCallback(() => {
    if (skill) discardLocalChanges(skill);
  }, [discardLocalChanges, skill]);

  const savePhase = resolveSkillEditorSavePhase({
    isFileDirty: isDirty,
    isConfigDirty,
    hasUnsavedLocalAssets,
    saveQueueItems,
    isSaving: saveLoading || configLoading || isSaveQueueActive,
  });

  return {
    clearDraftCache,
    configLoading,
    consumeRestoredEditorDraft,
    discardLocalSkillChanges,
    handleSave,
    hasConfigValuesMissing,
    hasMissingConfig,
    hasSaveableChanges,
    hasSavedConfigMissing,
    hasUnsafeNavigation,
    hasUnsavedSkillChanges,
    isConfigDirty,
    isDirty,
    isSaveQueueActive,
    resetConfigDraft,
    runUpdateConfigAsync,
    saveCurrentFile,
    saveLoading,
    savePendingChanges,
    savePhase,
    visibleSaveQueueItems,
  };
}
