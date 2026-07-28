import { useInteractService, useSkillService } from '@/domains';
import { useRequest } from 'ahooks';
import type { TFunction } from 'i18next';

import {
  canEditSkill,
  canPreviewSelectedSkillFile,
  getDisabledSkillVersionKeys,
  getSkillConfigBadge,
  getSkillVersionItems,
  selectSkillFile,
} from '../model';
import { useSkillEditorController } from './useSkillEditorController';
import { useSkillFileTree } from './useSkillFileTree';
import { useSkillMarkdownPreview } from './useSkillMarkdownPreview';
import { SKILL_CONFIG_NODE_ID, useSkillNavigationGuard } from './useSkillNavigationGuard';
import { useSkillSave } from './useSkillSave';

interface UseSkillWorkspaceControllerOptions {
  resourceId: string;
  t: TFunction<'skill'>;
}

export function useSkillWorkspaceController({ resourceId, t }: UseSkillWorkspaceControllerOptions) {
  const skillService = useSkillService();
  const interactService = useInteractService();
  const { state: editorState, actions: editorActions } = useSkillEditorController();
  const {
    files: activeFiles,
    selectedFileId,
    selectedTreeNodeId,
    editing,
    editorContent,
    savedContent,
    viewingVersion,
    configName,
    configDescription,
  } = editorState;
  const { setEditing, setEditorContent, setConfigName, setConfigDescription } = editorActions;

  const {
    data: skill,
    loading,
    error,
    refresh: refreshSkill,
  } = useRequest(() => skillService.getSkillDetail(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
  });

  useRequest(() => interactService.recordResourceRead(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
  });

  const isConfigSelected = selectedTreeNodeId === SKILL_CONFIG_NODE_ID;
  const selectedFile = selectSkillFile(activeFiles, selectedFileId, isConfigSelected);
  const canEdit = canEditSkill(skill, viewingVersion);
  const canPreviewSelectedFile = canPreviewSelectedSkillFile(selectedFile);
  const saveState = useSkillSave({
    actions: editorActions,
    canEdit,
    refreshSkill,
    selectedFile,
    skill,
    skillService,
    state: editorState,
  });
  const {
    clearDraftCache,
    configLoading,
    consumeRestoredEditorDraft,
    discardLocalSkillChanges: discardEditorChanges,
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
  } = saveState;
  const fileTreeState = useSkillFileTree({
    actions: editorActions,
    canEdit,
    consumeRestoredEditorDraft,
    isConfigDirty,
    isConfigSelected,
    isDirty,
    isSaveQueueActive,
    refreshSkill,
    saveLoading,
    selectedFile,
    skill,
    skillService,
    state: editorState,
  });
  const {
    applyTreeSelection,
    canEditTree,
    cancelPendingCreate,
    contentLoading,
    deleteLoading,
    deleteTarget,
    expandedKeys,
    fileInputRef,
    handleCommitCreate,
    handleConfirmDelete,
    handleDeleteFile,
    handleFileChange,
    handleMoveFile,
    handleStartCreate,
    handleTreeDragLeave,
    handleTreeDragOver,
    handleTreeDrop,
    handleTreeWrapClick,
    isTreeDragOver,
    moveLoading,
    pendingCreate,
    setDeleteTarget,
  } = fileTreeState;
  const navigationState = useSkillNavigationGuard({
    actions: editorActions,
    applyTreeSelection,
    cancelPendingCreate,
    clearDraftCache,
    configLoading,
    discardEditorChanges,
    hasMissingConfig,
    hasSavedConfigMissing,
    hasUnsafeNavigation,
    hasUnsavedSkillChanges,
    isConfigDirty,
    isConfigSelected,
    isDirty,
    isSaveQueueActive,
    refreshSkill,
    resetConfigDraft,
    runUpdateConfigAsync,
    saveCurrentFile,
    saveLoading,
    savePendingChanges,
    skill,
    skillService,
    state: editorState,
  });
  const {
    handleCancelPendingIntent,
    handleConfirmPendingIntent,
    handleDiscardPendingIntent,
    handlePublish,
    handleTreeSelect,
    handleVersionSelect,
    pendingIntentLoading,
    pendingIntentMode,
    publishLoading,
    versionLoading,
  } = navigationState;
  const markdownPreviewState = useSkillMarkdownPreview({
    editorContent,
    files: activeFiles,
    onSelectFile: handleTreeSelect,
    selectedFile,
    skill,
    skillService,
    viewingVersion: viewingVersion ?? undefined,
  });
  const {
    onEditorMount: handleMarkdownEditorMount,
    onPreviewScroll: handleMarkdownPreviewScroll,
    onViewChange: handleMarkdownViewChange,
    previewRef: markdownPreviewRef,
    resourceResolver: markdownResourceResolver,
    selectedView: selectedMarkdownView,
  } = markdownPreviewState;
  const versionItems = getSkillVersionItems(skill, viewingVersion);
  const disabledVersionKeys = getDisabledSkillVersionKeys(skill, versionItems);
  const configBadge = getSkillConfigBadge(hasConfigValuesMissing, isConfigDirty);

  const handleToggleEditing = () => {
    if (editing) {
      setEditorContent(savedContent);
      setEditing(false);
      return;
    }
    setEditing(true);
  };

  return {
    activeFiles,
    canEdit,
    canEditTree,
    cancelPendingCreate,
    canPreviewSelectedFile,
    configDescription,
    configLoading,
    configName,
    contentLoading,
    deleteLoading,
    deleteTarget,
    editing,
    editorContent,
    error,
    expandedKeys,
    fileInputRef,
    handleCancelPendingIntent,
    handleCommitCreate,
    handleConfirmDelete,
    handleConfirmPendingIntent,
    handleDeleteFile,
    handleDiscardPendingIntent,
    handleFileChange,
    handleMarkdownEditorMount,
    handleMarkdownPreviewScroll,
    handleMarkdownViewChange,
    handleMoveFile,
    handlePublish,
    handleSave,
    handleStartCreate,
    handleToggleEditing,
    handleTreeDragLeave,
    handleTreeDragOver,
    handleTreeDrop,
    handleTreeSelect,
    handleTreeWrapClick,
    handleVersionSelect,
    hasConfigValuesMissing,
    hasSaveableChanges,
    isConfigDirty,
    isConfigSelected,
    isDirty,
    isSaveQueueActive,
    isTreeDragOver,
    configBadge,
    loading,
    markdownPreviewRef,
    markdownResourceResolver,
    moveLoading,
    pendingCreate,
    pendingIntentLoading,
    pendingIntentMode,
    publishLoading,
    refreshSkill,
    resetConfigDraft,
    runUpdateConfigAsync,
    saveLoading,
    savePhase,
    selectedFile,
    selectedFileId,
    selectedMarkdownView,
    selectedTreeNodeId,
    setConfigDescription,
    setConfigName,
    setDeleteTarget,
    setEditorContent,
    skill,
    versionItems,
    disabledVersionKeys,
    versionLoading,
    viewingVersion,
    visibleSaveQueueItems,
  };
}
