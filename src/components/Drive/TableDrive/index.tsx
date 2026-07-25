import AppIconButton from '@/components/Button/AppIconButton';
import {
  DriveDelete,
  MoveNodeModal,
  RenameNodeModal,
  TrashDelete,
} from '@/components/Drive/Modals';
import EntryIcon from '@/components/Icons/EntryIcon';
import {
  FolderTable,
  type FolderTableBreadcrumbItem,
  type FolderTableRowAction,
} from '@/components/Table';
import { useDriveService } from '@/domains';
import type { DriveNode } from '@/domains/Drive';
import { parseErrorMessage } from '@/utils/error';
import { resolveResourceKind, type ResourceViewer } from '@/utils/navigation/resourceTarget';
import { findTreeNodeById } from '@/utils/tree/findTreeNodeById';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Button, toast, type SortDescriptor } from '@heroui/react';
import { useRequest } from 'ahooks';
import { PanelRightClose, PanelRightOpen, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getDriveNodeLabel,
  isDriveActionTarget,
  isDriveSharedFolderNode,
  isDriveSystemFolderNode,
  resolveCurrentFolderTagId,
  resolveDriveScope,
  type DriveActionTarget,
} from '../common/driveComponentModel';
import { useClickNode } from '../common/useClickNode';
import type { DriveTableRow, TableDriveProps } from './index.type';
import CreateMenu from './parts/CreateMenu';
import DriveDetailPanel from './parts/DriveDetailPanel';
import styles from './style.module.less';
import { buildDriveTableColumns } from './tableColumns';
import { buildDriveTableRowMap, isDrivePinnedFirstRow, toDriveTableRow } from './tableRows';
import { useTableDrive } from './useTableDrive';
import { useTableDriveActions } from './useTableDriveActions';

function toBreadcrumbItems(pathNodes: DriveNode[]): FolderTableBreadcrumbItem[] {
  return pathNodes
    .filter((node) => node.type !== 'loading')
    .map((node, index) => ({
      id: node.id,
      label: getDriveNodeLabel(node),
      isRoot: index === 0,
    }));
}

function isDriveDragSource(row: DriveTableRow): boolean {
  return isDriveActionTarget(row.node) && !isDriveSharedFolderNode(row.node);
}

function isDriveMoveTargetNode(node: DriveNode): boolean {
  return (node.type === 'folder' || node.type === 'root') && !isDriveSharedFolderNode(node);
}

interface DriveDndNameContentProps {
  row: DriveTableRow;
  draggableDisabled: boolean;
  droppableDisabled: boolean;
  children: ReactNode;
}

function DriveDndNameContent({
  row,
  draggableDisabled,
  droppableDisabled,
  children,
}: DriveDndNameContentProps) {
  const draggable = useDraggable({
    id: `drive-row:${row.id}`,
    disabled: draggableDisabled,
    data: { rowId: row.id },
  });
  const droppable = useDroppable({
    id: `drive-folder:${row.id}`,
    disabled: droppableDisabled,
    data: { targetNodeId: row.node.id },
  });
  const setDraggableNodeRef = draggable.setNodeRef;
  const setActivatorNodeRef = draggable.setActivatorNodeRef;
  const setDroppableNodeRef = droppable.setNodeRef;
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDraggableNodeRef(node);
      setActivatorNodeRef(node);
      setDroppableNodeRef(node?.closest<HTMLElement>('[data-folder-row-id]') ?? null);
    },
    [setActivatorNodeRef, setDraggableNodeRef, setDroppableNodeRef]
  );

  return (
    <span
      ref={setNodeRef}
      className={styles.dndNameContent}
      data-dragging={draggable.isDragging ? 'true' : undefined}
      data-drop-target={droppable.isOver ? 'true' : undefined}
      onMouseDownCapture={(event) => {
        draggable.listeners?.onMouseDown?.(event);
      }}
    >
      {children}
    </span>
  );
}

interface DriveDroppableBreadcrumbProps {
  targetNode: DriveNode;
  disabled: boolean;
  children: ReactNode;
}

function DriveDroppableBreadcrumb({
  targetNode,
  disabled,
  children,
}: DriveDroppableBreadcrumbProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drive-breadcrumb:${targetNode.id}`,
    disabled,
    data: { targetNodeId: targetNode.id },
  });

  return (
    <span
      ref={setNodeRef}
      className={styles.breadcrumbDropTarget}
      data-drop-target={isOver ? 'true' : undefined}
    >
      {children}
    </span>
  );
}

function DriveDragOverlay({ row, count }: { row: DriveTableRow; count: number }) {
  const { t } = useTranslation('drive');
  return (
    <div className={styles.dragOverlay}>
      <span className={styles.dragOverlayIcon}>
        <EntryIcon
          entryType={row.entryType}
          folderIconType={row.folderIconType}
          resourceType={row.resourceType}
          resourceIconType={row.resourceIconType}
        />
      </span>
      <span className={styles.dragOverlayName}>{row.name}</span>
      <span className={styles.dragOverlayCount}>{t('table.dragSelected', { count })}</span>
    </div>
  );
}

function TableDrive({
  groupId,
  rootId,
  initialNodeId,
  onCurrentNodeChange,
  scope,
  breadcrumbExtra,
  actions,
}: TableDriveProps) {
  const { t } = useTranslation(['drive', 'resource', 'common']);
  const driveService = useDriveService();
  const resolvedScope = useMemo(
    () => resolveDriveScope(scope, groupId, rootId),
    [scope, groupId, rootId]
  );
  const finalRootId = resolvedScope.rootId;
  const finalGroupId = resolvedScope.groupId;
  const {
    currentNodeId,
    dataSource,
    pathNodes,
    loading,
    expandedRowKeys,
    enterFolder,
    handleExpand,
    refresh,
  } = useTableDrive({
    initialNodeId,
    scope: resolvedScope.scope,
  });
  const [checkedRowKeys, setCheckedRowKeys] = useState<Set<string>>(new Set());
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const [isDetailPanelCollapsed, setIsDetailPanelCollapsed] = useState(false);
  const [draggingRowKeys, setDraggingRowKeys] = useState<Set<string>>(new Set());
  const [activeDragRowId, setActiveDragRowId] = useState<string | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | undefined>();
  const lastSortClickRef = useRef<{ column: string; time: number } | null>(null);

  const handleSortChange = useCallback((descriptor: SortDescriptor) => {
    const now = Date.now();
    const last = lastSortClickRef.current;
    const column = String(descriptor.column);

    if (last && last.column === column && now - last.time < 300) {
      // 双击同一列 → 回到默认未排序状态
      lastSortClickRef.current = null;
      setSortDescriptor(undefined);
      return;
    }

    lastSortClickRef.current = { column, time: now };
    setSortDescriptor(descriptor);
  }, []);
  const [renameTarget, setRenameTarget] = useState<DriveActionTarget | null>(null);
  const [moveNodes, setMoveNodes] = useState<DriveActionTarget[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DriveActionTarget | null>(null);
  const beforeTrashNodeIdRef = useRef<string | null>(null);
  const draggingRowKeysRef = useRef<Set<string>>(new Set());
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const updateDraggingRowKeys = useCallback((keys: Set<string>) => {
    draggingRowKeysRef.current = keys;
    setDraggingRowKeys(keys);
  }, []);

  const handleClearSelection = useCallback(() => {
    setCheckedRowKeys(new Set());
  }, []);

  const handleEnterFolder = useCallback(
    (nodeId: string) => {
      setCheckedRowKeys(new Set());
      setSelectedRowId(undefined);
      updateDraggingRowKeys(new Set());
      setActiveDragRowId(null);
      onCurrentNodeChange?.(nodeId);
      enterFolder(nodeId);
    },
    [enterFolder, onCurrentNodeChange, updateDraggingRowKeys]
  );
  const handleClickNode = useClickNode({
    enterFolder: handleEnterFolder,
  });
  const rows = useMemo(() => dataSource.map((node) => toDriveTableRow(node, t)), [dataSource, t]);
  const rowMap = useMemo(() => buildDriveTableRowMap(rows), [rows]);
  const selectedRow = selectedRowId ? rowMap.get(selectedRowId) : undefined;
  const selectedActionTargets = useMemo(() => {
    const targets: DriveActionTarget[] = [];
    checkedRowKeys.forEach((rowId) => {
      const node = rowMap.get(rowId)?.node;
      if (node && isDriveActionTarget(node) && !isDriveSystemFolderNode(node)) {
        targets.push(node);
      }
    });
    return targets;
  }, [checkedRowKeys, rowMap]);
  const canBatchMove =
    checkedRowKeys.size > 0 && selectedActionTargets.length === checkedRowKeys.size;
  const sharedRowKeys = useMemo(
    () =>
      new Set(
        [...rowMap.values()].filter((row) => isDriveSharedFolderNode(row.node)).map((row) => row.id)
      ),
    [rowMap]
  );
  const driveNodeMap = useMemo(() => {
    const map = new Map<string, DriveNode>();
    rowMap.forEach((row) => {
      map.set(row.node.id, row.node);
    });
    pathNodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [pathNodes, rowMap]);

  const { loading: batchDeleting, run: runBatchDelete } = useRequest(
    async () => {
      const ids = [...checkedRowKeys];
      await Promise.all(
        ids.map((nodeId) => driveService.removeNode({ nodeId, groupId: finalGroupId }))
      );
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('table.batchDeleted', { count: checkedRowKeys.size }));
        setCheckedRowKeys(new Set());
        refresh();
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const checkboxSelection = useMemo(
    () => ({
      selectedKeys: checkedRowKeys,
      onSelectionChange: (keys: Set<string>) => {
        setCheckedRowKeys(keys);
        if (keys.size > 0) {
          setSelectedRowId(undefined);
        }
      },
      hiddenKeys: sharedRowKeys,
    }),
    [checkedRowKeys, sharedRowKeys]
  );

  const activeDragRow = useMemo(
    () => (activeDragRowId ? rowMap.get(activeDragRowId) : undefined),
    [activeDragRowId, rowMap]
  );
  const currentDirectoryItemCount = useMemo(
    () => rows.filter((row) => row.entryType !== 'loading').length,
    [rows]
  );

  const handleNodeActionSuccess = useCallback(() => {
    handleClearSelection();
    refresh();
  }, [handleClearSelection, refresh]);

  const handleOpenRename = useCallback((node: DriveActionTarget) => {
    setRenameTarget(node);
  }, []);

  const handleOpenMove = useCallback((node: DriveActionTarget) => {
    setMoveNodes([node]);
  }, []);

  const handleOpenBatchMove = useCallback(() => {
    if (!canBatchMove) return;
    setMoveNodes(selectedActionTargets);
  }, [canBatchMove, selectedActionTargets]);

  const handleOpenDelete = useCallback((node: DriveActionTarget) => {
    setDeleteTarget(node);
  }, []);

  const handleDeleteModalOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteTarget(null);
  }, []);

  const { loading: movingByDrag, run: runMoveRowsByDrag } = useRequest(
    async ({
      sourceRowIds,
      targetFolderNodeId,
    }: {
      sourceRowIds: string[];
      targetFolderNodeId: string;
    }) => {
      return driveService.moveNodesToFolder({
        nodeIds: sourceRowIds,
        targetFolderNodeId,
        groupId: finalGroupId,
      });
    },
    {
      manual: true,
      onSuccess: (movedCount) => {
        if (movedCount === 0) {
          return;
        }
        handleClearSelection();
        refresh();
        if (movedCount > 1) {
          toast.success(t('move.feedback.moved', { count: movedCount }));
        } else if (movedCount === 1) {
          toast.success(t('table.movedSingle'));
        }
      },
      onError: (error) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const canOpenTrash = !finalGroupId;
  const { data: trashFolderNodeId, runAsync: resolveTrashFolderNodeId } = useRequest(
    () => driveService.getTrashFolderNodeId(finalGroupId),
    {
      ready: canOpenTrash,
      refreshDeps: [finalGroupId],
    }
  );
  const isTrashView = Boolean(
    canOpenTrash &&
    trashFolderNodeId &&
    (currentNodeId === trashFolderNodeId ||
      pathNodes.some((pathNode) => pathNode.id === trashFolderNodeId))
  );
  const selectionFooter = useMemo(() => {
    if (checkedRowKeys.size === 0) return null;
    return (
      <div className={styles.selectionActions}>
        {canBatchMove ? (
          <Button variant="secondary" size="sm" onPress={handleOpenBatchMove}>
            {t('table.move')}
          </Button>
        ) : null}
        {!isTrashView ? (
          <Button
            variant="danger"
            size="sm"
            isDisabled={batchDeleting}
            onPress={() => runBatchDelete()}
          >
            {t('actions.delete', { ns: 'common' })}
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" onPress={handleClearSelection}>
          {t('table.clearSelection')}
        </Button>
      </div>
    );
  }, [
    batchDeleting,
    canBatchMove,
    checkedRowKeys.size,
    handleClearSelection,
    handleOpenBatchMove,
    isTrashView,
    runBatchDelete,
    t,
  ]);
  const isEditMode = checkedRowKeys.size > 0;
  const openTrash = useCallback(async () => {
    if (!canOpenTrash) {
      return;
    }

    // 已在回收站 → 返回之前的目录
    if (isTrashView) {
      handleEnterFolder(beforeTrashNodeIdRef.current ?? finalRootId);
      beforeTrashNodeIdRef.current = null;
      return;
    }

    try {
      const resolvedTrashFolderNodeId = trashFolderNodeId ?? (await resolveTrashFolderNodeId());
      if (!resolvedTrashFolderNodeId) {
        toast.danger(t('table.trashNotFound'));
        return;
      }
      beforeTrashNodeIdRef.current = currentNodeId;
      handleEnterFolder(resolvedTrashFolderNodeId);
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    }
  }, [
    canOpenTrash,
    currentNodeId,
    finalRootId,
    handleEnterFolder,
    isTrashView,
    resolveTrashFolderNodeId,
    trashFolderNodeId,
    t,
  ]);

  const targetTagId = useMemo(
    () => resolveCurrentFolderTagId(currentNodeId, pathNodes),
    [currentNodeId, pathNodes]
  );
  const breadcrumbItems = useMemo(() => toBreadcrumbItems(pathNodes), [pathNodes]);
  const {
    showCreateMenu,
    showUploadToGroup,
    showManagePermission,
    createMenuItems,
    handleCreateMenuSelect,
    openUploadToGroup,
    openTagAccessPermission,
    openTagMountPermission,
    openResourcePermission,
    ModalHost,
  } = useTableDriveActions({
    currentNodeId,
    currentRows: rows,
    scope: resolvedScope.scope,
    actions,
    refresh,
    targetTagId,
    isTrashView,
  });
  const toolbar = useMemo(
    () => (
      <div className={styles.toolbarActions}>
        {!isEditMode && showCreateMenu ? (
          <CreateMenu items={createMenuItems} onSelect={handleCreateMenuSelect} />
        ) : null}
        {!isEditMode && showUploadToGroup ? (
          <Button variant="secondary" size="sm" onPress={openUploadToGroup}>
            {t('table.addFromPersonal')}
          </Button>
        ) : null}
        {!isEditMode && canOpenTrash ? (
          <Button variant={isTrashView ? 'primary' : 'secondary'} size="sm" onPress={openTrash}>
            <Trash2 size={16} aria-hidden="true" />
            {isTrashView ? t('page.backToDrive') : t('node.trash')}
          </Button>
        ) : null}
        <AppIconButton
          icon={
            isDetailPanelCollapsed ? (
              <PanelRightOpen size={16} aria-hidden="true" />
            ) : (
              <PanelRightClose size={16} aria-hidden="true" />
            )
          }
          label={isDetailPanelCollapsed ? t('table.expandDetails') : t('table.collapseDetails')}
          size="sm"
          className={styles.detailPanelToggle}
          onPress={() => setIsDetailPanelCollapsed((collapsed) => !collapsed)}
        />
      </div>
    ),
    [
      createMenuItems,
      handleCreateMenuSelect,
      isEditMode,
      isDetailPanelCollapsed,
      isTrashView,
      openUploadToGroup,
      openTrash,
      canOpenTrash,
      showCreateMenu,
      showUploadToGroup,
      t,
    ]
  );

  const handleExpandedChange = useCallback(
    async (keys: string[]) => {
      const addedKey = keys.find((key) => !expandedRowKeys.includes(key));
      if (addedKey) {
        const row = findTreeNodeById(dataSource, addedKey);
        if (row) {
          await handleExpand(true, row);
          return;
        }
      }
      const removedKey = expandedRowKeys.find((key) => !keys.includes(key));
      if (removedKey) {
        const row = findTreeNodeById(dataSource, removedKey);
        if (row) {
          await handleExpand(false, row);
          return;
        }
      }
    },
    [dataSource, expandedRowKeys, handleExpand]
  );

  const handleRowActivate = useCallback(
    (row: DriveTableRow, viewer?: ResourceViewer) => {
      handleClickNode(row.node, viewer);
    },
    [handleClickNode]
  );

  const handleRowSelect = useCallback((row: DriveTableRow) => {
    if (row.node.type !== 'loading') {
      setSelectedRowId(row.id);
    }
  }, []);

  const resolveRowActions = useCallback(
    (row: DriveTableRow): FolderTableRowAction<DriveTableRow>[] => {
      if (isEditMode || !isDriveActionTarget(row.node)) return [];
      const actionTarget = row.node;
      if (actionTarget.type === 'folder' && actionTarget.systemType === 'shared') return [];

      const openAction: FolderTableRowAction<DriveTableRow> =
        actionTarget.type === 'folder'
          ? {
              key: 'enter',
              label: t('table.enter'),
              onPress: () => handleEnterFolder(actionTarget.id),
            }
          : {
              key: 'open',
              label: t('table.open'),
              onPress: () => handleClickNode(row.node),
            };

      const actions: FolderTableRowAction<DriveTableRow>[] = [openAction];

      if (showManagePermission && !isTrashView) {
        if (actionTarget.type === 'folder') {
          actions.push(
            {
              key: 'tag-access-permission',
              label: t('permission.accessPermission', { ns: 'resource' }),
              onPress: () => openTagAccessPermission(actionTarget.tagId),
            },
            {
              key: 'tag-mount-permission',
              label: t('permission.mountPermission', { ns: 'resource' }),
              onPress: () => openTagMountPermission(actionTarget.tagId),
            }
          );
        } else if (actionTarget.type === 'resource') {
          actions.push({
            key: 'resource-permission',
            label: t('permission.resourcePermission', { ns: 'resource' }),
            onPress: () =>
              openResourcePermission({
                resourceId: actionTarget.resourceId,
                resourceType: resolveResourceKind(actionTarget.resourceType),
                resourceName: row.name,
                fallbackTagId: actionTarget.folderTagId,
              }),
          });
        }
      }

      if (isDriveSystemFolderNode(actionTarget)) {
        return actions;
      }

      if (actionTarget.type !== 'link') {
        actions.push({
          key: 'rename',
          label: t('actions.rename', { ns: 'common' }),
          onPress: () => handleOpenRename(actionTarget),
        });
      }

      actions.push(
        {
          key: 'move',
          label: isTrashView ? t('move.titleToDrive') : t('table.move'),
          onPress: () => handleOpenMove(actionTarget),
        },
        {
          key: 'delete',
          label:
            finalGroupId != null
              ? t('delete.remove')
              : isTrashView
                ? t('delete.permanent')
                : actionTarget.type === 'link'
                  ? t('delete.deleteLink')
                  : t('delete.moveToTrash'),
          variant: 'danger',
          onPress: () => handleOpenDelete(actionTarget),
        }
      );

      return actions;
    },
    [
      finalGroupId,
      handleClickNode,
      handleEnterFolder,
      handleOpenDelete,
      handleOpenMove,
      handleOpenRename,
      isTrashView,
      isEditMode,
      openResourcePermission,
      openTagAccessPermission,
      openTagMountPermission,
      showManagePermission,
      t,
    ]
  );

  const resolveDragSourceIds = useCallback(
    (row: DriveTableRow): string[] => {
      if (!isDriveDragSource(row)) {
        return [];
      }
      const sourceIds = checkedRowKeys.has(row.id) ? [...checkedRowKeys] : [row.id];
      return sourceIds.filter((rowId) => {
        const sourceRow = rowMap.get(rowId);
        return sourceRow ? isDriveDragSource(sourceRow) : false;
      });
    },
    [checkedRowKeys, rowMap]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const rowId = event.active.data.current?.rowId;
      if (typeof rowId !== 'string') {
        return;
      }
      const row = rowMap.get(rowId);
      if (!row) {
        return;
      }
      const sourceRowIds = resolveDragSourceIds(row);
      if (sourceRowIds.length === 0 || movingByDrag) {
        return;
      }

      const nextDraggingRowKeys = new Set(sourceRowIds);
      updateDraggingRowKeys(nextDraggingRowKeys);
      setActiveDragRowId(row.id);
    },
    [movingByDrag, resolveDragSourceIds, rowMap, updateDraggingRowKeys]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const targetNodeId = event.over?.data.current?.targetNodeId;
      const sourceRowIds = [...draggingRowKeysRef.current];
      const targetNode =
        typeof targetNodeId === 'string' ? driveNodeMap.get(targetNodeId) : undefined;

      if (
        targetNode &&
        isDriveMoveTargetNode(targetNode) &&
        sourceRowIds.length > 0 &&
        !sourceRowIds.includes(targetNode.id)
      ) {
        runMoveRowsByDrag({
          sourceRowIds,
          targetFolderNodeId: targetNode.id,
        });
      }

      updateDraggingRowKeys(new Set());
      setActiveDragRowId(null);
    },
    [driveNodeMap, runMoveRowsByDrag, updateDraggingRowKeys]
  );

  const handleDragCancel = useCallback(() => {
    updateDraggingRowKeys(new Set());
    setActiveDragRowId(null);
  }, [updateDraggingRowKeys]);

  const renderBreadcrumbItem = useCallback(
    (content: ReactNode, item: FolderTableBreadcrumbItem) => {
      const targetNode = driveNodeMap.get(item.id);
      if (!targetNode) {
        return content;
      }
      return (
        <DriveDroppableBreadcrumb
          targetNode={targetNode}
          disabled={
            movingByDrag || draggingRowKeys.size === 0 || !isDriveMoveTargetNode(targetNode)
          }
        >
          {content}
        </DriveDroppableBreadcrumb>
      );
    },
    [draggingRowKeys.size, driveNodeMap, movingByDrag]
  );

  const breadcrumb = useMemo(
    () => (
      <>
        <FolderTable.Breadcrumb
          items={breadcrumbItems}
          onJump={handleEnterFolder}
          renderItem={renderBreadcrumbItem}
        />
        {breadcrumbExtra}
      </>
    ),
    [breadcrumbExtra, breadcrumbItems, handleEnterFolder, renderBreadcrumbItem]
  );

  const renderNameContent = useCallback(
    (content: ReactNode, row: DriveTableRow) => (
      <DriveDndNameContent
        row={row}
        draggableDisabled={movingByDrag || !isDriveDragSource(row)}
        droppableDisabled={
          movingByDrag || draggingRowKeys.size === 0 || !isDriveMoveTargetNode(row.node)
        }
      >
        {content}
      </DriveDndNameContent>
    ),
    [draggingRowKeys.size, movingByDrag]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <main className={styles.listArea}>
        <div className={styles.driveFrame}>
          <div className={styles.driveBody}>
            <div className={styles.tablePanel}>
              <FolderTable<DriveTableRow>
                ariaLabel={t('table.aria')}
                items={rows}
                columns={buildDriveTableColumns(t)}
                loading={loading}
                breadcrumb={breadcrumb}
                toolbar={toolbar}
                expandedRowKeys={expandedRowKeys}
                onExpandedChange={handleExpandedChange}
                selectedRowKey={selectedRow?.id}
                onRowSelect={handleRowSelect}
                onRowActivate={handleRowActivate}
                renderNameContent={renderNameContent}
                totalCount={currentDirectoryItemCount}
                summary={t('table.summary', { count: currentDirectoryItemCount })}
                className={styles.table}
                sortDescriptor={sortDescriptor}
                onSortChange={handleSortChange}
                isPinnedFirst={isDrivePinnedFirstRow}
                rowActions={resolveRowActions}
                isEditMode={isEditMode}
                checkboxSelection={checkboxSelection}
                selectionFooter={selectionFooter}
              />
            </div>
            <aside
              className={styles.detailPanel}
              data-collapsed={isDetailPanelCollapsed ? 'true' : undefined}
              aria-label={t('table.detailsAsideAria')}
            >
              {!isDetailPanelCollapsed ? (
                <DriveDetailPanel
                  key={selectedRow?.id ?? (isEditMode ? 'edit-mode' : 'empty')}
                  selectedRow={selectedRow}
                  isEditMode={isEditMode}
                  selectedCount={checkedRowKeys.size}
                  groupId={finalGroupId}
                  isTrashView={isTrashView}
                  showManagePermission={showManagePermission}
                  onActivate={handleRowActivate}
                  onRename={handleOpenRename}
                  onMove={handleOpenMove}
                  onDelete={handleOpenDelete}
                  onOpenTagAccessPermission={openTagAccessPermission}
                  onOpenTagMountPermission={openTagMountPermission}
                  onOpenResourcePermission={openResourcePermission}
                />
              ) : null}
            </aside>
          </div>
        </div>
        {ModalHost}
        <RenameNodeModal
          isOpen={Boolean(renameTarget)}
          node={renameTarget}
          groupId={finalGroupId}
          onOpenChange={(open) => {
            if (!open) setRenameTarget(null);
          }}
          onSuccess={refresh}
        />
        <MoveNodeModal
          isOpen={moveNodes.length > 0}
          nodes={moveNodes}
          rootId={finalRootId}
          groupId={finalGroupId}
          isTrashView={isTrashView}
          onOpenChange={(open) => {
            if (!open) setMoveNodes([]);
          }}
          onSuccess={handleNodeActionSuccess}
        />
        {isTrashView ? (
          <TrashDelete
            isOpen={Boolean(deleteTarget)}
            node={deleteTarget}
            onOpenChange={handleDeleteModalOpenChange}
            onSuccess={handleNodeActionSuccess}
          />
        ) : (
          <DriveDelete
            isOpen={Boolean(deleteTarget)}
            node={deleteTarget}
            groupId={finalGroupId}
            onOpenChange={handleDeleteModalOpenChange}
            onSuccess={handleNodeActionSuccess}
          />
        )}
      </main>
      <DragOverlay>
        {activeDragRow && draggingRowKeys.size > 0 ? (
          <DriveDragOverlay row={activeDragRow} count={draggingRowKeys.size} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TableDrive;
