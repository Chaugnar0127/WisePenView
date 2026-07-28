import AppIconButton from '@/components/Button/AppIconButton';
import { DriveCreateModal } from '@/components/Drive/Modals';
import { Empty, ResultState, Spin } from '@/components/Feedback';
import Markdown from '@/components/Markdown';
import AppAlertDialog from '@/components/Overlay/AppAlertDialog';
import SkillEditor from '@/components/Skill/SkillEditor';
import SkillFileTree from '@/components/Skill/SkillFileTree';
import type { DataNode } from '@/components/Tree';
import VersionDropdown from '@/components/VersionDropdown';
import { SkillServicesMap } from '@/domains/Skill';
import { parseErrorMessage } from '@/utils/error';
import { RESOURCE_KIND } from '@/utils/navigation/resourceTarget';
import {
  useResourceHostLayoutConfig,
  type ResourceHostLayoutConfig,
} from '@/views/workspace/ResourceHostContext';
import { Button, Tabs } from '@heroui/react';
import { FolderPlus, Pencil, Plus, Save, Settings, Upload } from 'lucide-react';
import { type DependencyList, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SkillConfigPanel from './_components/SkillConfigPanel';
import SkillSaveQueueDock from './_components/SkillSaveQueueDock';
import UnsavedSkillChangesModal from './_components/UnsavedSkillChangesModal';
import { useSkillWorkspaceController } from './_hooks/useSkillWorkspaceController';
import { SKILL_CONFIG_NODE_ID } from './_hooks/useSkillNavigationGuard';
import { formatSkillSaveStatus } from './model';
import styles from './style.module.less';
import { canPreviewSkillFile } from './utils/skillFileTree';
import { isMarkdownSkillFile } from './utils/skillMarkdown';

interface SkillViewProps {
  resourceId?: string;
}

interface SkillLayoutConfigProps {
  children: ReactNode;
  config?: ResourceHostLayoutConfig;
  deps: DependencyList;
}

function SkillLayoutConfig({ children, config, deps }: SkillLayoutConfigProps) {
  const frameConfig = {
    className: styles.pageWrap,
    ...(config ?? {}),
  } satisfies ResourceHostLayoutConfig;
  useResourceHostLayoutConfig(() => frameConfig, deps);

  return <>{children}</>;
}

function SkillView({ resourceId = '' }: SkillViewProps = {}) {
  const { t } = useTranslation('skill');
  const {
    activeFiles,
    canEdit,
    canEditTree,
    cancelPendingCreate,
    canPreviewSelectedFile,
    configBadge,
    configDescription,
    configLoading,
    configName,
    contentLoading,
    createModalOpen,
    deleteLoading,
    deleteTarget,
    editing,
    editorContent,
    error,
    expandedKeys,
    fileInputRef,
    handleCancelPendingIntent,
    handleCloseCreateModal,
    handleCommitCreate,
    handleConfirmDelete,
    handleConfirmPendingIntent,
    handleCreateSuccess,
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
    isSaveQueueActive,
    isTreeDragOver,
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
    setCreateModalOpen,
    setDeleteTarget,
    setEditorContent,
    skill,
    versionItems,
    disabledVersionKeys,
    versionLoading,
    viewingVersion,
    visibleSaveQueueItems,
  } = useSkillWorkspaceController({ resourceId, t });
  const headerSaveStatusText = formatSkillSaveStatus(canEdit ? savePhase : undefined, t);

  const headerConfig = {
    sidePanel: skill?.resourceInfo
      ? { resource: skill.resourceInfo, onResourceChanged: refreshSkill }
      : undefined,
    header: {
      resource: {
        resourceId: skill?.resourceId ?? resourceId,
        resourceName: skill?.title || t('page.resourceFallbackName'),
        resourceIconType: 'skill',
        currentActions: skill?.currentActions,
        copyVersion: skill?.version,
        permissionResourceType: RESOURCE_KIND.SKILL,
        ownerId: skill?.ownerId,
        onPermissionSuccess: refreshSkill,
        titleMeta: headerSaveStatusText ? (
          <span
            className={`${styles.toolbarSaveStatus} ${
              savePhase === 'dirty' || savePhase === 'failed' ? styles.toolbarSaveStatusDirty : ''
            }`}
          >
            {headerSaveStatusText}
          </span>
        ) : undefined,
        actions: skill ? (
          <div className={styles.topBarActions}>
            {canEdit ? (
              <>
                <Button
                  variant="secondary"
                  onPress={handleToggleEditing}
                  isDisabled={
                    !canPreviewSelectedFile ||
                    contentLoading ||
                    saveLoading ||
                    configLoading ||
                    isSaveQueueActive ||
                    moveLoading
                  }
                >
                  <Pencil size={16} />
                  <span>{t(editing ? 'header.cancelEditing' : 'header.edit')}</span>
                </Button>
                {editing || hasSaveableChanges ? (
                  <Button
                    variant="secondary"
                    onPress={handleSave}
                    isDisabled={
                      !hasSaveableChanges ||
                      contentLoading ||
                      saveLoading ||
                      configLoading ||
                      isSaveQueueActive ||
                      moveLoading
                    }
                  >
                    <Save size={16} />
                    <span>{t('header.save')}</span>
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  onPress={handlePublish}
                  isDisabled={
                    publishLoading ||
                    contentLoading ||
                    saveLoading ||
                    configLoading ||
                    isSaveQueueActive ||
                    moveLoading
                  }
                >
                  <Upload size={16} />
                  <span>{t('header.publish')}</span>
                </Button>
              </>
            ) : null}
            <VersionDropdown
              items={versionItems}
              disabledKeys={disabledVersionKeys}
              formatVersion={SkillServicesMap.formatVersion}
              onSelect={handleVersionSelect}
            />
          </div>
        ) : undefined,
      },
    },
  } satisfies ResourceHostLayoutConfig;
  const layoutConfigDeps = [
    canEdit,
    canPreviewSelectedFile,
    configLoading,
    contentLoading,
    editing,
    hasSaveableChanges,
    headerSaveStatusText,
    isSaveQueueActive,
    moveLoading,
    publishLoading,
    resourceId,
    saveLoading,
    savePhase,
    skill,
    t,
    viewingVersion,
  ];
  const configTreeNodes = [
    {
      key: SKILL_CONFIG_NODE_ID,
      draggable: false,
      isLeaf: true,
      title: (
        <span className={styles.configTreeNode}>
          <span className={styles.configTreeTitle}>
            <span className={styles.configTreeIcon} aria-hidden="true">
              <Settings size={14} />
            </span>
            <span className={styles.configTreeName}>{t('config.title')}</span>
          </span>
          <span className={styles.configTreeBadge}>{t(`config.badge.${configBadge}`)}</span>
        </span>
      ),
    },
  ] satisfies DataNode[];

  if (!resourceId) {
    return (
      <SkillLayoutConfig config={headerConfig} deps={layoutConfigDeps}>
        <div className={styles.middleOverlay}>
          <ResultState
            status="info"
            title={t('page.createTitle')}
            extra={
              <Button variant="primary" onPress={() => setCreateModalOpen(true)}>
                {t('page.createAction')}
              </Button>
            }
          />
        </div>
        <DriveCreateModal
          type="skill"
          isOpen={createModalOpen}
          onOpenChange={handleCloseCreateModal}
          onSuccess={handleCreateSuccess}
        />
      </SkillLayoutConfig>
    );
  }

  if (error) {
    return (
      <SkillLayoutConfig config={headerConfig} deps={layoutConfigDeps}>
        <div className={styles.middleOverlay}>
          <ResultState
            status="warning"
            title={t('page.openFailed')}
            subTitle={parseErrorMessage(error)}
            extra={
              <Link to="/app/drive/personal">
                <Button variant="secondary">{t('page.backToDrive')}</Button>
              </Link>
            }
          />
        </div>
      </SkillLayoutConfig>
    );
  }

  if (loading && !skill) {
    return (
      <SkillLayoutConfig config={headerConfig} deps={layoutConfigDeps}>
        <div className={styles.middleOverlay} aria-busy="true" aria-live="polite">
          <div className={styles.middleOverlayLoading}>
            <Spin size="large" />
            <span>{t('page.loading')}</span>
          </div>
        </div>
      </SkillLayoutConfig>
    );
  }

  return (
    <SkillLayoutConfig config={headerConfig} deps={layoutConfigDeps}>
      <div className={styles.page}>
        <div className={styles.mainArea}>
          {skill ? (
            <div className={styles.contentRow}>
              <div className={styles.middlePanelSlot}>
                <section className={styles.middlePanel}>
                  <div className={styles.middlePanelHeader}>
                    <span className={styles.middlePanelLabel}>{t('fileTree.title')}</span>
                    {canEditTree ? (
                      <div className={styles.middlePanelActions}>
                        <AppIconButton
                          icon={<FolderPlus size={14} aria-hidden="true" />}
                          label={t('fileTree.newFolder')}
                          size="sm"
                          className={styles.iconBtnSm}
                          onClick={() => handleStartCreate('folder')}
                        />
                        <AppIconButton
                          icon={<Plus size={14} aria-hidden="true" />}
                          label={t('fileTree.newFile')}
                          size="sm"
                          className={styles.iconBtnSm}
                          onClick={() => handleStartCreate('file')}
                        />
                        <AppIconButton
                          icon={<Upload size={14} aria-hidden="true" />}
                          label={t('fileTree.upload')}
                          size="sm"
                          className={styles.iconBtnSm}
                          onClick={() => fileInputRef.current?.click()}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={`${styles.treeWrap} ${isTreeDragOver ? styles.treeWrapDragOver : ''}`}
                    onDragOver={handleTreeDragOver}
                    onDragLeave={handleTreeDragLeave}
                    onDrop={handleTreeDrop}
                    onClick={handleTreeWrapClick}
                  >
                    {canEditTree && isTreeDragOver ? (
                      <div className={styles.treeDropHint}>{t('fileTree.dropHint')}</div>
                    ) : null}
                    <SkillFileTree
                      files={activeFiles}
                      prependNodes={configTreeNodes}
                      selectedFileId={selectedFileId}
                      selectedNodeId={selectedTreeNodeId}
                      expandedKeys={expandedKeys}
                      pendingCreate={pendingCreate}
                      isOwner={canEditTree}
                      onSelect={handleTreeSelect}
                      onCommitCreate={handleCommitCreate}
                      onCancelCreate={cancelPendingCreate}
                      onDeleteFile={handleDeleteFile}
                      onMoveFile={handleMoveFile}
                    />
                    {activeFiles.length === 0 && !pendingCreate ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={t(canEdit ? 'fileTree.emptyEditable' : 'fileTree.empty')}
                        className={styles.emptyBlock}
                      />
                    ) : null}
                  </div>
                  <SkillSaveQueueDock items={visibleSaveQueueItems} onRetry={handleSave} />
                </section>
              </div>

              <div className={styles.rightPanelSlot}>
                <main className={styles.rightPanel}>
                  {isConfigSelected ? (
                    <SkillConfigPanel
                      name={configName}
                      description={configDescription}
                      canEdit={canEdit}
                      isDirty={isConfigDirty}
                      isLoading={configLoading}
                      onNameChange={setConfigName}
                      onDescriptionChange={setConfigDescription}
                      onReset={resetConfigDraft}
                      onSave={() => void runUpdateConfigAsync()}
                    />
                  ) : selectedFile ? (
                    <>
                      <header className={styles.editorHeader}>
                        <span className={styles.editorFileName}>{selectedFile.name}</span>
                        {isMarkdownSkillFile(selectedFile) ? (
                          <Tabs
                            className={styles.editorTabs}
                            selectedKey={selectedMarkdownView}
                            onSelectionChange={(key) => handleMarkdownViewChange(String(key))}
                          >
                            <Tabs.ListContainer>
                              <Tabs.List
                                className={styles.editorTabsList}
                                aria-label={t('preview.markdownMode')}
                              >
                                <Tabs.Tab id="preview" className={styles.editorTab}>
                                  {t('preview.preview')}
                                  <Tabs.Indicator />
                                </Tabs.Tab>
                                <Tabs.Tab id="markdown" className={styles.editorTab}>
                                  {t('preview.markdown')}
                                  <Tabs.Indicator />
                                </Tabs.Tab>
                              </Tabs.List>
                            </Tabs.ListContainer>
                          </Tabs>
                        ) : null}
                      </header>
                      <div className={styles.editorBody}>
                        {isMarkdownSkillFile(selectedFile) && selectedMarkdownView === 'preview' ? (
                          <div
                            ref={markdownPreviewRef}
                            className={styles.markdownPreview}
                            onScroll={(event) => handleMarkdownPreviewScroll(event.currentTarget)}
                          >
                            <div className={styles.markdownPreviewContent}>
                              <Markdown
                                content={editorContent}
                                resourceResolver={markdownResourceResolver}
                              />
                            </div>
                          </div>
                        ) : canPreviewSkillFile(selectedFile) ? (
                          <SkillEditor
                            content={editorContent}
                            fileName={selectedFile.name}
                            readOnly={
                              !editing ||
                              !canEdit ||
                              contentLoading ||
                              saveLoading ||
                              isSaveQueueActive ||
                              versionLoading ||
                              moveLoading
                            }
                            onSave={handleSave}
                            onChange={setEditorContent}
                            onEditorMount={handleMarkdownEditorMount}
                          />
                        ) : (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={t('preview.unsupported')}
                            className={styles.emptyBlock}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t('preview.selectFile')}
                      className={styles.emptyBlock}
                    />
                  )}
                </main>
              </div>
            </div>
          ) : (
            <div className={styles.middleOverlay}>
              <ResultState status="warning" title={t('page.openFailed')} />
            </div>
          )}
        </div>
      </div>

      <AppAlertDialog
        type="danger"
        isOpen={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t(deleteTarget?.kind === 'folder' ? 'delete.folderTitle' : 'delete.fileTitle')}
        description={
          deleteTarget?.kind === 'folder'
            ? t('delete.folderDescription', { name: deleteTarget?.name })
            : t('delete.fileDescription', { name: deleteTarget?.name })
        }
        confirmText={t('delete.confirm')}
        onConfirm={handleConfirmDelete}
        isConfirmLoading={deleteLoading}
        isDismissable={!deleteLoading}
      />

      <UnsavedSkillChangesModal
        isOpen={pendingIntentMode != null}
        mode={pendingIntentMode ?? 'leave'}
        isLoading={pendingIntentLoading}
        onCancel={handleCancelPendingIntent}
        onDiscard={handleDiscardPendingIntent}
        onConfirm={handleConfirmPendingIntent}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => void handleFileChange(event)}
      />
      <DriveCreateModal
        type="skill"
        isOpen={createModalOpen}
        onOpenChange={handleCloseCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </SkillLayoutConfig>
  );
}

export default SkillView;
