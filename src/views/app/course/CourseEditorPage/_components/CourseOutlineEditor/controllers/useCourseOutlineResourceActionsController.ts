import type { FolderTableRowAction } from '@/components/Table';
import { useCourseService } from '@/domains';
import type { DriveNode } from '@/domains/Drive';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { OutlineRow } from '../model';

interface UseCourseOutlineResourceActionsOptions {
  courseId: string;
  folderRows: OutlineRow[];
  onMutated: () => void;
}

export const useCourseOutlineResourceActionsController = ({
  courseId,
  folderRows,
  onMutated,
}: UseCourseOutlineResourceActionsOptions) => {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const navigate = useNavigate();
  const [removeRow, setRemoveRow] = useState<OutlineRow>();
  const [moveRow, setMoveRow] = useState<OutlineRow>();
  const removeRequest = useRequest(
    async () => {
      if (!removeRow?.resourceId || !removeRow.parentId) return;
      await courseService.removeCourseOutlineResource({
        courseId,
        resourceId: removeRow.resourceId,
        sourceNodeId: removeRow.parentId,
      });
    },
    {
      manual: true,
      onSuccess: () => {
        setRemoveRow(undefined);
        onMutated();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );
  const moveRequest = useRequest(
    async (targetNodeId: string) => {
      if (!moveRow?.resourceId || !moveRow.parentId) return;
      await courseService.moveCourseOutlineResource({
        courseId,
        resourceId: moveRow.resourceId,
        sourceNodeId: moveRow.parentId,
        targetNodeId,
      });
    },
    {
      manual: true,
      onSuccess: () => {
        setMoveRow(undefined);
        onMutated();
        toast.success(t('editor.outline.saved'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );

  return {
    getRowActions: (row: OutlineRow): FolderTableRowAction<OutlineRow>[] => [
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
        onPress: () => setMoveRow(row),
      },
      {
        key: 'remove',
        label: t('editor.outline.removeResource'),
        variant: 'danger',
        onPress: () => setRemoveRow(row),
      },
    ],
    movement: {
      row: moveRow,
      loading: moveRequest.loading,
      close: () => setMoveRow(undefined),
      confirm: moveRequest.run,
      isTargetSelectable: (node: DriveNode) =>
        node.type === 'folder' &&
        node.tagId !== moveRow?.parentId &&
        folderRows.some((row) => row.nodeId === node.tagId),
    },
    removal: {
      row: removeRow,
      loading: removeRequest.loading,
      close: () => setRemoveRow(undefined),
      confirm: removeRequest.run,
    },
  };
};
