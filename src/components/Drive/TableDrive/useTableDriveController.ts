import { useDriveService } from '@/domains';
import type { DriveNode } from '@/domains/Drive';
import { parseErrorMessage } from '@/utils/error';
import { toast, type SortDescriptor } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { TFunction } from 'i18next';
import { useRef, useState } from 'react';
import {
  isDriveActionTarget,
  isDriveSharedFolderNode,
  isDriveSystemFolderNode,
  resolveDriveScope,
  type DriveActionTarget,
} from '../common/driveComponentModel';
import { useClickNode } from '../common/useClickNode';
import type { TableDriveProps } from './index.type';
import { buildDriveTableRowMap, toDriveTableRow } from './tableRows';
import { useTableDrive } from './useTableDrive';
import { useTableDriveDnd } from './useTableDriveDnd';

interface UseTableDriveControllerOptions {
  actions: TableDriveProps['actions'];
  groupId: string | undefined;
  initialNodeId: string | undefined;
  onCurrentNodeChange: TableDriveProps['onCurrentNodeChange'];
  rootId: string | undefined;
  scope: TableDriveProps['scope'];
  t: TFunction<'drive' | 'resource' | 'common'>;
}

export function useTableDriveController({
  groupId,
  rootId,
  initialNodeId,
  onCurrentNodeChange,
  scope,
  t,
}: UseTableDriveControllerOptions) {
  const driveService = useDriveService();
  const resolvedScope = resolveDriveScope(scope, groupId, rootId);
  const finalRootId = resolvedScope.rootId;
  const finalGroupId = resolvedScope.groupId;
  const canOpenTrash = !finalGroupId;

  const {
    currentNodeId,
    dataSource,
    pathNodes,
    loading,
    expandedRowKeys,
    enterFolder,
    handleExpandedChange,
    refresh,
  } = useTableDrive({ initialNodeId, scope: resolvedScope.scope });

  const [checkedRowKeys, setCheckedRowKeys] = useState<Set<string>>(new Set());
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const [isDetailPanelCollapsed, setIsDetailPanelCollapsed] = useState(false);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>();
  const [renameTarget, setRenameTarget] = useState<DriveActionTarget | null>(null);
  const [moveNodes, setMoveNodes] = useState<DriveActionTarget[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DriveActionTarget | null>(null);
  const lastSortClickRef = useRef<{ column: string; time: number } | null>(null);
  const beforeTrashNodeIdRef = useRef<string | null>(null);

  const rows = dataSource.map((node) => toDriveTableRow(node, t));
  const rowMap = buildDriveTableRowMap(rows);
  const selectedRow = selectedRowId ? rowMap.get(selectedRowId) : undefined;
  const selectedActionTargets: DriveActionTarget[] = [];
  checkedRowKeys.forEach((rowId) => {
    const node = rowMap.get(rowId)?.node;
    if (node && isDriveActionTarget(node) && !isDriveSystemFolderNode(node)) {
      selectedActionTargets.push(node);
    }
  });
  const canBatchMove =
    checkedRowKeys.size > 0 && selectedActionTargets.length === checkedRowKeys.size;
  const sharedRowKeys = new Set(
    [...rowMap.values()].filter((row) => isDriveSharedFolderNode(row.node)).map((row) => row.id)
  );
  const currentDirectoryItemCount = rows.filter((row) => row.entryType !== 'loading').length;

  const clearSelection = () => setCheckedRowKeys(new Set());
  const handleNodeActionSuccess = () => {
    clearSelection();
    refresh();
  };
  const handleEnterFolder = (nodeId: string) => {
    clearSelection();
    setSelectedRowId(undefined);
    clearDragState();
    onCurrentNodeChange?.(nodeId);
    enterFolder(nodeId);
  };

  const handleClickNode = useClickNode({ enterFolder: handleEnterFolder });

  const handleSortChange = (descriptor: SortDescriptor) => {
    const now = Date.now();
    const column = String(descriptor.column);
    const last = lastSortClickRef.current;
    if (last && last.column === column && now - last.time < 300) {
      lastSortClickRef.current = null;
      setSortDescriptor(undefined);
      return;
    }
    lastSortClickRef.current = { column, time: now };
    setSortDescriptor(descriptor);
  };

  const { loading: batchDeleting, run: runBatchDelete } = useRequest(
    async () => {
      await Promise.all(
        [...checkedRowKeys].map((nodeId) =>
          driveService.removeNode({ nodeId, groupId: finalGroupId })
        )
      );
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('table.batchDeleted', { count: checkedRowKeys.size }));
        handleNodeActionSuccess();
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const { data: trashFolderNodeId, runAsync: resolveTrashFolderNodeId } = useRequest(
    () => driveService.getTrashFolderNodeId(finalGroupId),
    { ready: canOpenTrash, refreshDeps: [finalGroupId] }
  );

  const isTrashView = Boolean(
    canOpenTrash &&
    trashFolderNodeId &&
    (currentNodeId === trashFolderNodeId || pathNodes.some((node) => node.id === trashFolderNodeId))
  );

  const openTrash = async () => {
    if (!canOpenTrash) return;
    if (isTrashView) {
      handleEnterFolder(beforeTrashNodeIdRef.current ?? finalRootId);
      beforeTrashNodeIdRef.current = null;
      return;
    }
    try {
      const targetNodeId = trashFolderNodeId ?? (await resolveTrashFolderNodeId());
      if (!targetNodeId) {
        toast.danger(t('table.trashNotFound'));
        return;
      }
      beforeTrashNodeIdRef.current = currentNodeId;
      handleEnterFolder(targetNodeId);
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    }
  };

  const {
    sensors,
    draggingCount,
    activeDragRow,
    clearDragState,
    handleDragStart,
    handleDragEnd,
    renderBreadcrumbItem,
    renderNameContent,
  } = useTableDriveDnd({
    rowMap,
    pathNodes: pathNodes as DriveNode[],
    checkedRowKeys,
    groupId: finalGroupId,
    onMoveSuccess: handleNodeActionSuccess,
  });

  return {
    activeDragRow,
    batchDeleting,
    canBatchMove,
    canOpenTrash,
    checkedRowKeys,
    clearDragState,
    currentDirectoryItemCount,
    currentNodeId,
    dataSource,
    deleteTarget,
    draggingCount,
    expandedRowKeys,
    finalGroupId,
    finalRootId,
    handleClickNode,
    handleDragEnd,
    handleDragStart,
    handleEnterFolder,
    handleExpandedChange,
    handleNodeActionSuccess,
    handleSortChange,
    isDetailPanelCollapsed,
    isTrashView,
    moveNodes,
    openTrash,
    pathNodes,
    refresh,
    renameTarget,
    renderBreadcrumbItem,
    renderNameContent,
    resolvedScope,
    rowMap,
    rows,
    runBatchDelete,
    selectedActionTargets,
    selectedRow,
    sensors,
    setCheckedRowKeys,
    setDeleteTarget,
    setIsDetailPanelCollapsed,
    setMoveNodes,
    setRenameTarget,
    setSelectedRowId,
    sharedRowKeys,
    sortDescriptor,
    loading,
  };
}
