import { UploadDocumentModal } from '@/components/Drive/Modals';
import { Input } from '@/components/Input';
import { AppAlertDialog, AppFormDialog } from '@/components/Overlay';
import { FolderTable, type FolderTableRow, type FolderTableRowAction } from '@/components/Table';
import { useCourseService } from '@/domains';
import type { CourseOutlineEditorNode } from '@/domains/Course';
import { parseErrorMessage } from '@/utils/error';
import { Button, Label, ListBox, Select, TextField, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './CourseEditorPage.module.less';
import CourseResourcePickerModal from './CourseResourcePickerModal';

interface OutlineRow extends FolderTableRow {
  nodeId: string;
  resourceId?: string;
  parentId?: string;
}

interface CourseOutlineEditorProps {
  courseId: string;
}

type DialogState =
  | { type: 'create'; parentId?: string }
  | { type: 'rename'; nodeId: string; currentName: string }
  | null;

const mapRows = (nodes: CourseOutlineEditorNode[]): OutlineRow[] =>
  nodes.map((node) => ({
    id: node.nodeId,
    nodeId: node.nodeId,
    resourceId: node.resourceId,
    parentId: node.parentId,
    name: node.name,
    entryType: node.entryType,
    resourceType: node.resourceType,
    typeLabel: node.entryType === 'folder' ? '章节' : (node.resourceType ?? '资源'),
    isExpandable: node.entryType === 'folder' && Boolean(node.children?.length),
    children: node.children ? mapRows(node.children) : undefined,
  }));

const collectFolderRows = (rows: OutlineRow[]): OutlineRow[] =>
  rows.flatMap((row) => [
    ...(row.entryType === 'folder' ? [row] : []),
    ...collectFolderRows((row.children ?? []) as OutlineRow[]),
  ]);

const findFolderSiblings = (rows: OutlineRow[], row: OutlineRow): OutlineRow[] | undefined => {
  const folderRows = rows.filter((item) => item.entryType === 'folder');
  if (folderRows.some((item) => item.nodeId === row.nodeId)) return folderRows;
  for (const item of folderRows) {
    const siblings = findFolderSiblings((item.children ?? []) as OutlineRow[], row);
    if (siblings) return siblings;
  }
  return undefined;
};

function CourseOutlineEditor({ courseId }: CourseOutlineEditorProps) {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const navigate = useNavigate();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<OutlineRow>();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogName, setDialogName] = useState('');
  const [deleteRow, setDeleteRow] = useState<OutlineRow>();
  const [removeResourceRow, setRemoveResourceRow] = useState<OutlineRow>();
  const [moveResourceRow, setMoveResourceRow] = useState<OutlineRow>();
  const [moveTargetId, setMoveTargetId] = useState<string>();
  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [localUploadOpen, setLocalUploadOpen] = useState(false);

  const { data, loading, refresh } = useRequest(() =>
    courseService.getCourseOutlineEditor(courseId)
  );
  const { loading: mutating, run: submitDialog } = useRequest(
    async () => {
      if (!dialog || !dialogName.trim()) return;
      if (dialog.type === 'create') {
        await courseService.createCourseOutlineSection({
          courseId,
          parentId: dialog.parentId,
          name: dialogName.trim(),
        });
      } else {
        await courseService.renameCourseOutlineSection({
          courseId,
          nodeId: dialog.nodeId,
          name: dialogName.trim(),
        });
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setDialog(null);
        setDialogName('');
        refresh();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );
  const { loading: deleting, run: confirmDelete } = useRequest(
    async () => {
      if (!deleteRow) return;
      await courseService.deleteCourseOutlineSection({ courseId, nodeId: deleteRow.nodeId });
    },
    {
      manual: true,
      onSuccess: () => {
        setDeleteRow(undefined);
        setSelectedRow(undefined);
        refresh();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );
  const { loading: removingResource, run: confirmRemoveResource } = useRequest(
    async () => {
      if (!removeResourceRow?.resourceId || !removeResourceRow.parentId) return;
      await courseService.removeCourseOutlineResource({
        courseId,
        resourceId: removeResourceRow.resourceId,
        sourceNodeId: removeResourceRow.parentId,
      });
    },
    {
      manual: true,
      onSuccess: () => {
        setRemoveResourceRow(undefined);
        refresh();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );
  const { loading: movingResource, run: confirmMoveResource } = useRequest(
    async () => {
      if (!moveResourceRow?.resourceId || !moveResourceRow.parentId || !moveTargetId) return;
      await courseService.moveCourseOutlineResource({
        courseId,
        resourceId: moveResourceRow.resourceId,
        sourceNodeId: moveResourceRow.parentId,
        targetNodeId: moveTargetId,
      });
    },
    {
      manual: true,
      onSuccess: () => {
        setMoveResourceRow(undefined);
        setMoveTargetId(undefined);
        refresh();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );

  const rows = mapRows(data ?? []);
  const folderRows = collectFolderRows(rows);
  const selectedFolder = selectedRow?.entryType === 'folder' ? selectedRow : undefined;
  const openCreate = (parentId?: string) => {
    setDialog({ type: 'create', parentId });
    setDialogName('');
  };
  const openRename = (row: OutlineRow) => {
    setDialog({ type: 'rename', nodeId: row.nodeId, currentName: row.name });
    setDialogName(row.name);
  };

  const moveSection = async (row: OutlineRow, offset: -1 | 1) => {
    const siblings = findFolderSiblings(rows, row);
    if (!siblings) return;
    const index = siblings.findIndex((item) => item.nodeId === row.nodeId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
    const orderedRows = [...siblings];
    [orderedRows[index], orderedRows[targetIndex]] = [orderedRows[targetIndex], orderedRows[index]];
    try {
      await courseService.reorderCourseOutlineSections({
        courseId,
        orderedNodeIds: orderedRows.map((item) => item.nodeId),
      });
      refresh();
    } catch (error: unknown) {
      toast.danger(parseErrorMessage(error));
    }
  };

  const rowActions = (row: OutlineRow): FolderTableRowAction<OutlineRow>[] => {
    if (row.entryType === 'resource') {
      return [
        {
          key: 'open',
          label: t('editor.outline.openResource'),
          onPress: () =>
            navigate(
              `/app/course/${courseId}/learning?resourceId=${encodeURIComponent(row.resourceId ?? '')}`
            ),
        },
        {
          key: 'move',
          label: t('editor.outline.moveResource'),
          onPress: () => {
            setMoveResourceRow(row);
            setMoveTargetId(undefined);
          },
        },
        {
          key: 'remove',
          label: t('editor.outline.removeResource'),
          variant: 'danger',
          onPress: () => setRemoveResourceRow(row),
        },
      ];
    }
    const siblings = findFolderSiblings(rows, row) ?? [];
    const siblingIndex = siblings.findIndex((item) => item.nodeId === row.nodeId);
    return [
      {
        key: 'create-child',
        label: t('editor.outline.createSection'),
        onPress: () => openCreate(row.nodeId),
      },
      { key: 'rename', label: t('editor.actions.rename'), onPress: () => openRename(row) },
      {
        key: 'move-up',
        label: t('editor.actions.moveUp'),
        visible: siblingIndex > 0,
        onPress: () => void moveSection(row, -1),
      },
      {
        key: 'move-down',
        label: t('editor.actions.moveDown'),
        visible: siblingIndex >= 0 && siblingIndex < siblings.length - 1,
        onPress: () => void moveSection(row, 1),
      },
      {
        key: 'delete',
        label: t('editor.actions.delete'),
        variant: 'danger',
        onPress: () => setDeleteRow(row),
      },
    ];
  };

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
        items={rows}
        loading={loading}
        expandedRowKeys={expandedKeys}
        onExpandedChange={setExpandedKeys}
        selectedRowKey={selectedRow?.id}
        onRowSelect={setSelectedRow}
        rowActions={rowActions}
        breadcrumb={
          <div className={styles.outlineTarget}>
            <span>{t('editor.outline.mountTarget')}</span>
            <strong>{selectedFolder?.name ?? t('editor.outline.selectTarget')}</strong>
          </div>
        }
        toolbar={
          <div className={styles.outlineActions}>
            <Button variant="secondary" onPress={() => openCreate()}>
              <FolderPlus size={16} aria-hidden />
              {t('editor.outline.createChapter')}
            </Button>
            <Button
              variant="secondary"
              isDisabled={!selectedFolder}
              onPress={() => openCreate(selectedFolder?.nodeId)}
            >
              <Plus size={16} aria-hidden />
              {t('editor.outline.createSection')}
            </Button>
            <Button
              variant="secondary"
              isDisabled={!selectedFolder}
              onPress={() => setCloudPickerOpen(true)}
            >
              {t('editor.outline.uploadDrive')}
            </Button>
            <Button
              variant="primary"
              isDisabled={!selectedFolder}
              onPress={() => setLocalUploadOpen(true)}
            >
              {t('editor.outline.uploadLocal')}
            </Button>
          </div>
        }
        emptyText={t('editor.outline.empty')}
        summary={t('editor.outline.summary', { count: rows.length })}
      />

      <AppFormDialog
        isOpen={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={
          dialog?.type === 'rename'
            ? t('editor.outline.renameTitle')
            : t('editor.outline.createTitle')
        }
        confirmText={t('editor.actions.confirm')}
        isSubmitting={mutating}
        isSubmitDisabled={!dialogName.trim()}
        onSubmit={() => submitDialog()}
      >
        <TextField value={dialogName} onChange={setDialogName} isRequired>
          <Label>{t('editor.outline.name')}</Label>
          <Input autoFocus />
        </TextField>
      </AppFormDialog>

      <AppAlertDialog
        type="danger"
        isOpen={deleteRow !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleteRow(undefined);
        }}
        title={t('editor.outline.deleteTitle')}
        description={t('editor.outline.deleteDescription', { name: deleteRow?.name ?? '' })}
        confirmText={t('editor.actions.delete')}
        isConfirmLoading={deleting}
        onConfirm={confirmDelete}
      />

      <AppFormDialog
        isOpen={moveResourceRow !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setMoveResourceRow(undefined);
            setMoveTargetId(undefined);
          }
        }}
        title={t('editor.outline.moveResourceTitle')}
        confirmText={t('editor.actions.confirm')}
        isSubmitting={movingResource}
        isSubmitDisabled={!moveTargetId}
        onSubmit={() => confirmMoveResource()}
      >
        <Select
          value={moveTargetId ?? ''}
          onChange={(value) => {
            if (typeof value === 'string') setMoveTargetId(value);
          }}
          aria-label={t('editor.outline.moveResourceTarget')}
        >
          <Label>{t('editor.outline.moveResourceTarget')}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {folderRows
                .filter((row) => row.nodeId !== moveResourceRow?.parentId)
                .map((row) => (
                  <ListBox.Item key={row.nodeId} id={row.nodeId}>
                    {row.name}
                  </ListBox.Item>
                ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </AppFormDialog>

      <AppAlertDialog
        type="danger"
        isOpen={removeResourceRow !== undefined}
        onOpenChange={(open) => {
          if (!open) setRemoveResourceRow(undefined);
        }}
        title={t('editor.outline.removeResourceTitle')}
        description={t('editor.outline.removeResourceDescription', {
          name: removeResourceRow?.name ?? '',
        })}
        confirmText={t('editor.outline.removeResource')}
        isConfirmLoading={removingResource}
        onConfirm={confirmRemoveResource}
      />

      {selectedFolder ? (
        <>
          <CourseResourcePickerModal
            isOpen={cloudPickerOpen}
            courseId={courseId}
            targetTagId={selectedFolder.nodeId}
            targetName={selectedFolder.name}
            onOpenChange={setCloudPickerOpen}
            onSuccess={refresh}
          />
          <UploadDocumentModal
            isOpen={localUploadOpen}
            pathTagId={selectedFolder.nodeId}
            description={t('editor.outline.localUploadDescription')}
            onOpenChange={setLocalUploadOpen}
            onSuccess={refresh}
          />
        </>
      ) : null}
    </>
  );
}

export default CourseOutlineEditor;
