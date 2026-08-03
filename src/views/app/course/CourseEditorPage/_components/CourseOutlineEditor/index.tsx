import { DriveFolderPickerModal, UploadDocumentModal } from '@/components/Drive/Modals';
import { Input } from '@/components/Input';
import { AppAlertDialog, AppFormDialog } from '@/components/Overlay';
import { FolderTable, type FolderTableRowAction } from '@/components/Table';
import { Button, Label, TextField } from '@heroui/react';
import { FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../style.module.less';
import CourseResourcePickerModal from '../CourseResourcePickerModal';
import { useCourseOutlineNavigationController } from './controllers/useCourseOutlineNavigationController';
import { useCourseOutlineResourceActionsController } from './controllers/useCourseOutlineResourceActionsController';
import { useCourseOutlineSectionActionsController } from './controllers/useCourseOutlineSectionActionsController';
import type { OutlineRow } from './model';

interface CourseOutlineEditorProps {
  courseId: string;
}

function CourseOutlineEditor({ courseId }: CourseOutlineEditorProps) {
  const { t } = useTranslation('course');
  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [localUploadOpen, setLocalUploadOpen] = useState(false);
  const navigation = useCourseOutlineNavigationController(courseId);
  const sectionActions = useCourseOutlineSectionActionsController({
    courseId,
    rows: navigation.rows,
    onMutated: navigation.refresh,
    onDeleted: navigation.clearSelection,
  });
  const resourceActions = useCourseOutlineResourceActionsController({
    courseId,
    folderRows: navigation.folderRows,
    onMutated: navigation.refresh,
  });
  const getRowActions = (row: OutlineRow): FolderTableRowAction<OutlineRow>[] =>
    row.entryType === 'resource'
      ? resourceActions.getRowActions(row)
      : sectionActions.getRowActions(row);

  return (
    <>
      <div className={styles.sectionHead}>
        <div>
          <h2>{t('editor.outline.title')}</h2>
          <p>
            {t('editor.outline.description')}
            <span className={styles.instantSave}>{t('editor.outline.instantSave')}</span>
          </p>
        </div>
      </div>
      <FolderTable<OutlineRow>
        ariaLabel={t('editor.outline.tableAria')}
        items={navigation.rows}
        loading={navigation.loading}
        expandedRowKeys={navigation.expandedKeys}
        onExpandedChange={navigation.setExpandedKeys}
        selectedRowKey={navigation.selectedRow?.id}
        onRowSelect={navigation.selectRow}
        rowActions={getRowActions}
        breadcrumb={
          <div className={styles.outlineTarget}>
            <span>{t('editor.outline.mountTarget')}</span>
            <strong>{navigation.selectedFolder?.name ?? t('editor.outline.selectTarget')}</strong>
          </div>
        }
        toolbar={
          <div className={styles.outlineActions}>
            <Button variant="secondary" onPress={() => sectionActions.dialog.openCreate()}>
              <FolderPlus size={16} aria-hidden />
              {t('editor.outline.createChapter')}
            </Button>
            <Button
              variant="secondary"
              isDisabled={!navigation.selectedFolder}
              onPress={() => sectionActions.dialog.openCreate(navigation.selectedFolder?.nodeId)}
            >
              <Plus size={16} aria-hidden />
              {t('editor.outline.createSection')}
            </Button>
            <Button
              variant="secondary"
              isDisabled={!navigation.selectedFolder}
              onPress={() => setCloudPickerOpen(true)}
            >
              {t('editor.outline.uploadDrive')}
            </Button>
            <Button
              variant="primary"
              isDisabled={!navigation.selectedFolder}
              onPress={() => setLocalUploadOpen(true)}
            >
              {t('editor.outline.uploadLocal')}
            </Button>
          </div>
        }
        emptyText={t('editor.outline.empty')}
        summary={t('editor.outline.summary', { count: navigation.rows.length })}
      />

      <AppFormDialog
        isOpen={sectionActions.dialog.value !== null}
        onOpenChange={(open) => {
          if (!open) sectionActions.dialog.close();
        }}
        title={
          sectionActions.dialog.value?.type === 'rename'
            ? t('editor.outline.renameTitle')
            : t('editor.outline.createTitle')
        }
        confirmText={t('editor.actions.confirm')}
        isSubmitting={sectionActions.dialog.submitting}
        isSubmitDisabled={!sectionActions.dialog.name.trim()}
        onSubmit={sectionActions.dialog.submit}
      >
        <TextField
          value={sectionActions.dialog.name}
          onChange={sectionActions.dialog.setName}
          isRequired
        >
          <Label>{t('editor.outline.name')}</Label>
          <Input autoFocus />
        </TextField>
      </AppFormDialog>

      <AppAlertDialog
        type="danger"
        isOpen={sectionActions.deletion.row !== undefined}
        onOpenChange={(open) => {
          if (!open) sectionActions.deletion.close();
        }}
        title={t('editor.outline.deleteTitle')}
        description={t('editor.outline.deleteDescription', {
          name: sectionActions.deletion.row?.name ?? '',
        })}
        confirmText={t('editor.actions.delete')}
        isConfirmLoading={sectionActions.deletion.loading}
        onConfirm={sectionActions.deletion.confirm}
      />

      <DriveFolderPickerModal
        isOpen={resourceActions.movement.row !== undefined}
        title={t('editor.outline.moveResourceTitle')}
        hint={t('editor.outline.moveResourceHint', {
          name: resourceActions.movement.row?.name ?? '',
        })}
        groupId={courseId}
        isNodeSelectable={resourceActions.movement.isTargetSelectable}
        isSubmitting={resourceActions.movement.loading}
        confirmText={t('editor.actions.confirm')}
        cancelText={t('editor.actions.cancel')}
        onOpenChange={(open) => {
          if (!open) resourceActions.movement.close();
        }}
        onConfirm={(target) => {
          if (target.tagId) resourceActions.movement.confirm(target.tagId);
        }}
      />

      <AppAlertDialog
        type="danger"
        isOpen={resourceActions.removal.row !== undefined}
        onOpenChange={(open) => {
          if (!open) resourceActions.removal.close();
        }}
        title={t('editor.outline.removeResourceTitle')}
        description={t('editor.outline.removeResourceDescription', {
          name: resourceActions.removal.row?.name ?? '',
        })}
        confirmText={t('editor.outline.removeResource')}
        isConfirmLoading={resourceActions.removal.loading}
        onConfirm={resourceActions.removal.confirm}
      />

      {navigation.selectedFolder ? (
        <>
          <CourseResourcePickerModal
            isOpen={cloudPickerOpen}
            courseId={courseId}
            targetTagId={navigation.selectedFolder.nodeId}
            targetName={navigation.selectedFolder.name}
            onOpenChange={setCloudPickerOpen}
            onSuccess={navigation.refresh}
          />
          <UploadDocumentModal
            isOpen={localUploadOpen}
            pathTagId={navigation.selectedFolder.nodeId}
            description={t('editor.outline.localUploadDescription')}
            onOpenChange={setLocalUploadOpen}
            onSuccess={navigation.refresh}
          />
        </>
      ) : null}
    </>
  );
}

export default CourseOutlineEditor;
