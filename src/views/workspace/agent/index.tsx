import { DriveCreateModal } from '@/components/Drive/Modals';
import { ResultState, Spin } from '@/components/Feedback';
import { UnsavedChangesDialog } from '@/components/Overlay';
import AppAlertDialog from '@/components/Overlay/AppAlertDialog';
import VersionDropdown from '@/components/VersionDropdown';
import { useOpenInWorkspace } from '@/hooks/useOpenInWorkspace';
import { useWorkspaceNavigationStore } from '@/layouts/Workspace/_store/useWorkspaceNavigationStore';
import { parseErrorMessage } from '@/utils/error';
import { RESOURCE_KIND } from '@/utils/navigation/resourceTarget';
import {
  useResourceHostLayoutConfig,
  type ResourceHostLayoutConfig,
} from '@/views/workspace/ResourceHostContext';
import { Button } from '@heroui/react';
import { Save, Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import AgentSectionNav from './_components/AgentSectionNav';
import AssetsSection from './_components/AssetsSection';
import BasicInfoSection from './_components/BasicInfoSection';
import CapabilitiesSection from './_components/CapabilitiesSection';
import MemorySection from './_components/MemorySection';
import ModelSection from './_components/ModelSection';
import SystemPromptSection, { type PromptMode } from './_components/SystemPromptSection';
import { useAgentWorkspaceController } from './_hooks/useAgentWorkspaceController';
import styles from './style.module.less';
import { buildGuidedPrompt, getDefaultGuidedPromptFields } from './systemPrompt';

interface Props {
  resourceId?: string;
}
const anchorSections = [
  ['agent-info', 'basic'],
  ['prompt', 'prompt'],
  ['model', 'model'],
  ['capabilities', 'capabilities'],
  ['memory', 'memory'],
  ['assets', 'assets'],
] as const;
const AGENT_SCROLL_CONTAINER_ID = 'agent-editor-scroll';

export default function AgentView({ resourceId }: Props) {
  const { t } = useTranslation(['agent', 'common']);
  const navigate = useNavigate();
  const openInWorkspace = useOpenInWorkspace();
  const controller = useAgentWorkspaceController({ resourceId, t });
  const [createOpen, setCreateOpen] = useState(!resourceId);
  const [promptResetOpen, setPromptResetOpen] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const anchors = anchorSections.map(([id, key]) => [id, t(`agent:page.anchor.${key}`)] as const);
  const { load, save, publish, upload, remove, blocker, versionLoading, viewingVersion } =
    controller;
  const handleRequestPromptMode = (mode: PromptMode) => {
    if (controller.requestPromptMode(mode) === 'confirmReset') setPromptResetOpen(true);
  };
  const headerConfig = {
    className: styles.pageWrap,
    chatAgentDebug:
      controller.currentDraftAgent && viewingVersion === null
        ? {
            agent: controller.currentDraftAgent,
            isDirty: controller.isDirty,
            isSaving: save.loading,
            onSaveDraft: controller.saveDraftForDebug,
          }
        : undefined,
    header: controller.displayAgent
      ? {
          resource: {
            resourceId: controller.displayAgent.resourceId,
            resourceName: controller.displayAgent.title,
            resourceIconType: 'agent',
            currentActions: controller.displayAgent.currentActions,
            copyVersion: controller.displayAgent.version,
            permissionResourceType: RESOURCE_KIND.AGENT,
            ownerId: controller.displayAgent.ownerId,
            titleMeta: (
              <span className={styles.saveStatus}>
                {t(
                  `agent:page.saveStatus.${
                    controller.savePhase === 'dirty' ||
                    controller.savePhase === 'saving' ||
                    controller.savePhase === 'failed'
                      ? controller.savePhase
                      : 'clean'
                  }`
                )}
              </span>
            ),
            actions: controller.displayAgent.isOwner ? (
              <div className={styles.headerActions}>
                <Button
                  variant="secondary"
                  isDisabled={
                    viewingVersion !== null || !controller.isDirty || save.loading || versionLoading
                  }
                  onPress={() => save.run()}
                >
                  <Save size={15} />
                  {t('common:actions.save')}
                </Button>
                <Button
                  variant="primary"
                  isDisabled={
                    viewingVersion !== null || publish.loading || save.loading || versionLoading
                  }
                  onPress={() => publish.run()}
                >
                  <Upload size={15} />
                  {t('agent:page.publishAction')}
                </Button>
                <VersionDropdown
                  items={controller.versionItems}
                  disabledKeys={controller.disabledVersionKeys}
                  formatVersion={(version) => `v${version}.0`}
                  onSelect={controller.handleVersionSelect}
                />
              </div>
            ) : undefined,
          },
        }
      : undefined,
  } satisfies ResourceHostLayoutConfig;
  useResourceHostLayoutConfig(
    () => headerConfig,
    [
      controller.draft,
      controller.isDirty,
      controller.savePhase,
      load.data,
      publish.loading,
      save.loading,
      t,
      versionLoading,
      viewingVersion,
    ]
  );
  if (!resourceId)
    return (
      <div className={styles.overlay}>
        <ResultState
          status="info"
          title={t('agent:page.createTitle')}
          extra={
            <Button variant="primary" onPress={() => setCreateOpen(true)}>
              {t('agent:page.createAction')}
            </Button>
          }
        />
        <DriveCreateModal
          type="agent"
          isOpen={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) navigate('/app/drive/personal', { replace: true });
          }}
          onSuccess={(id) =>
            openInWorkspace({
              resourceId: id,
              resourceType: RESOURCE_KIND.AGENT,
              driveLocation: { scope: useWorkspaceNavigationStore.getState().location.scope },
              replace: true,
            })
          }
        />
      </div>
    );
  if (load.error)
    return (
      <div className={styles.overlay}>
        <ResultState
          status="warning"
          title={t('agent:page.openFailed')}
          subTitle={parseErrorMessage(load.error)}
          extra={
            <Link to="/app/drive/personal">
              <Button variant="secondary">{t('agent:page.backToDrive')}</Button>
            </Link>
          }
        />
      </div>
    );
  if ((load.loading && !load.data) || !load.data || !controller.draft)
    return (
      <div className={styles.overlay}>
        <Spin size="large" />
        <span>{t('agent:page.loading')}</span>
      </div>
    );
  const disabled =
    !load.data.agent.isOwner ||
    viewingVersion !== null ||
    save.loading ||
    publish.loading ||
    versionLoading;
  return (
    <div className={styles.page}>
      <AgentSectionNav items={anchors} scrollContainerId={AGENT_SCROLL_CONTAINER_ID} />
      <main id={AGENT_SCROLL_CONTAINER_ID} className={styles.content}>
        <BasicInfoSection
          name={controller.draft.name}
          description={controller.draft.description}
          spec={controller.draft.spec}
          disabled={disabled}
          onNameChange={(value) => controller.setDraft((current) => ({ ...current, name: value }))}
          onDescriptionChange={(value) =>
            controller.setDraft((current) => ({ ...current, description: value }))
          }
          onSpecChange={controller.setSpec}
        />
        <SystemPromptSection
          markdown={controller.draft.spec.systemPrompt}
          mode={controller.promptMode}
          disabled={controller.isReadOnly}
          onModeRequest={handleRequestPromptMode}
          onMarkdownChange={(value) =>
            controller.setSpec({ ...controller.draft!.spec, systemPrompt: value })
          }
        />
        <ModelSection
          spec={controller.draft.spec}
          models={load.data.models}
          disabled={disabled}
          onChange={controller.setSpec}
        />
        <CapabilitiesSection
          spec={controller.draft.spec}
          tools={load.data.tools}
          skills={load.data.skills}
          disabled={disabled}
          onChange={controller.setSpec}
        />
        <MemorySection
          spec={controller.draft.spec}
          disabled={controller.isReadOnly}
          onChange={controller.setSpec}
        />
        <AssetsSection
          assets={controller.assets}
          disabled={controller.isReadOnly}
          uploading={upload.loading}
          onUpload={(files) => upload.run(files)}
          onDelete={setDeleteAssetId}
        />
      </main>
      <AppAlertDialog
        type="danger"
        isOpen={promptResetOpen}
        onOpenChange={setPromptResetOpen}
        title={t('agent:page.promptReset.title')}
        description={t('agent:page.promptReset.description')}
        cancelText={t('agent:page.promptReset.cancel')}
        confirmText={t('agent:page.promptReset.confirm')}
        onConfirm={() => {
          controller.setSpec({
            ...controller.draft!.spec,
            systemPrompt: buildGuidedPrompt(getDefaultGuidedPromptFields(), true),
          });
          controller.setPromptMode('guided');
          setPromptResetOpen(false);
        }}
      />
      <UnsavedChangesDialog
        type="confirm"
        isOpen={blocker.state === 'blocked'}
        isLoading={save.loading}
        title={t('agent:page.leave.title')}
        description={t('agent:page.leave.description')}
        cancelText={t('common:actions.cancel')}
        discardText={t('agent:page.leave.discard')}
        confirmText={t('agent:page.leave.confirm')}
        onCancel={() => blocker.reset?.()}
        onDiscard={() => blocker.proceed?.()}
        onConfirm={() => void controller.handleSaveAndLeave()}
      />
      <AppAlertDialog
        type="danger"
        isOpen={deleteAssetId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteAssetId(null);
        }}
        title={t('agent:page.deleteAsset.title')}
        description={t('agent:page.deleteAsset.description')}
        confirmText={t('common:actions.delete')}
        isConfirmLoading={remove.loading}
        onConfirm={async () => {
          if (!deleteAssetId) return;
          try {
            await remove.runAsync(deleteAssetId);
            setDeleteAssetId(null);
          } catch {
            // 请求错误已由 controller 提示，保留弹窗供用户重试。
          }
        }}
      />
    </div>
  );
}
