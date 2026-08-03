import type { FolderTableRowAction } from '@/components/Table';
import { useCourseService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findCourseOutlineFolderSiblings, type OutlineRow } from '../model';

type SectionDialog =
  { type: 'create'; parentId?: string } | { type: 'rename'; nodeId: string } | null;

interface UseCourseOutlineSectionActionsOptions {
  courseId: string;
  rows: OutlineRow[];
  onMutated: () => void;
  onDeleted: () => void;
}

export const useCourseOutlineSectionActionsController = ({
  courseId,
  rows,
  onMutated,
  onDeleted,
}: UseCourseOutlineSectionActionsOptions) => {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const [dialog, setDialog] = useState<SectionDialog>(null);
  const [dialogName, setDialogName] = useState('');
  const [deleteRow, setDeleteRow] = useState<OutlineRow>();

  const saveRequest = useRequest(
    async () => {
      const name = dialogName.trim();
      if (!dialog || !name) return;
      if (dialog.type === 'create') {
        await courseService.createCourseOutlineSection({
          courseId,
          parentId: dialog.parentId,
          name,
        });
      } else {
        await courseService.renameCourseOutlineSection({
          courseId,
          nodeId: dialog.nodeId,
          name,
        });
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setDialog(null);
        setDialogName('');
        onMutated();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );
  const deleteRequest = useRequest(
    async () => {
      if (deleteRow) {
        await courseService.deleteCourseOutlineSection({ courseId, nodeId: deleteRow.nodeId });
      }
    },
    {
      manual: true,
      onSuccess: () => {
        setDeleteRow(undefined);
        onDeleted();
        onMutated();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );
  const reorderRequest = useRequest(
    async (row: OutlineRow, offset: -1 | 1) => {
      const siblings = findCourseOutlineFolderSiblings(rows, row);
      if (!siblings) return;
      const index = siblings.findIndex((item) => item.nodeId === row.nodeId);
      const targetIndex = index + offset;
      if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
      const orderedRows = [...siblings];
      [orderedRows[index], orderedRows[targetIndex]] = [
        orderedRows[targetIndex],
        orderedRows[index],
      ];
      await courseService.reorderCourseOutlineSections({
        courseId,
        orderedNodeIds: orderedRows.map((item) => item.nodeId),
      });
    },
    {
      manual: true,
      onSuccess: onMutated,
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );

  const openCreate = (parentId?: string) => {
    setDialog({ type: 'create', parentId });
    setDialogName('');
  };
  const openRename = (row: OutlineRow) => {
    setDialog({ type: 'rename', nodeId: row.nodeId });
    setDialogName(row.name);
  };
  const getRowActions = (row: OutlineRow): FolderTableRowAction<OutlineRow>[] => {
    const siblings = findCourseOutlineFolderSiblings(rows, row) ?? [];
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
        onPress: () => reorderRequest.run(row, -1),
      },
      {
        key: 'move-down',
        label: t('editor.actions.moveDown'),
        visible: siblingIndex >= 0 && siblingIndex < siblings.length - 1,
        onPress: () => reorderRequest.run(row, 1),
      },
      {
        key: 'delete',
        label: t('editor.actions.delete'),
        variant: 'danger',
        onPress: () => setDeleteRow(row),
      },
    ];
  };

  return {
    dialog: {
      value: dialog,
      name: dialogName,
      setName: setDialogName,
      submitting: saveRequest.loading,
      openCreate,
      close: () => setDialog(null),
      submit: saveRequest.run,
    },
    deletion: {
      row: deleteRow,
      loading: deleteRequest.loading,
      close: () => setDeleteRow(undefined),
      confirm: deleteRequest.run,
    },
    getRowActions,
  };
};
