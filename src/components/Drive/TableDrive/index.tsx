import AppIconButton from '@/components/Button/AppIconButton';
import {
  DriveDeleteModal,
  MoveNodeModal,
  RenameNodeModal,
  TrashDeleteModal,
} from '@/components/Drive/Modals';
import { FolderTable, type FolderTableBreadcrumbItem } from '@/components/Table';
import type { DriveNode } from '@/domains/Drive';
import type { ResourceViewer } from '@/utils/navigation/resourceTarget';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { Button } from '@heroui/react';
import { PanelRightClose, PanelRightOpen, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDriveNodeLabel, resolveCurrentFolderTagId } from '../common/driveComponentModel';
import type { DriveTableRow, TableDriveProps } from './index.type';
import CreateMenu from './parts/CreateMenu';
import DriveDetailPanel from './parts/DriveDetailPanel';
import { DriveDragOverlay } from './parts/DriveDnd';
import styles from './style.module.less';
import { buildDriveTableColumns } from './tableColumns';
import { isDrivePinnedFirstRow } from './tableRows';
import { useTableDriveActions } from './useTableDriveActions';
import { useTableDriveController } from './useTableDriveController';
import { useTableDriveRowActions } from './useTableDriveRowActions';

function toBreadcrumbItems(pathNodes: DriveNode[]): FolderTableBreadcrumbItem[] {
  return pathNodes
    .filter((node) => node.type !== 'loading')
    .map((node, index) => ({
      id: node.id,
      label: getDriveNodeLabel(node),
      isRoot: index === 0,
    }));
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
  const {
    activeDragRow,
    batchDeleting,
    canBatchMove,
    canOpenTrash,
    checkedRowKeys,
    clearDragState,
    currentNodeId,
    pathNodes,
    loading,
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
    setCheckedRowKeys,
    setDeleteTarget,
    setIsDetailPanelCollapsed,
    setMoveNodes,
    setRenameTarget,
    setSelectedRowId,
    sharedRowKeys,
    sortDescriptor,
    draggingCount,
    currentDirectoryItemCount,
    deleteTarget,
    sensors,
  } = useTableDriveController({
    actions,
    groupId,
    initialNodeId,
    onCurrentNodeChange,
    rootId,
    scope,
    t,
  });
  const columns = buildDriveTableColumns(t);

  const checkboxSelection = {
    selectedKeys: checkedRowKeys,
    onSelectionChange: (keys: Set<string>) => {
      setCheckedRowKeys(keys);
      if (keys.size > 0) {
        setSelectedRowId(undefined);
      }
    },
    hiddenKeys: sharedRowKeys,
  };

  const handleDeleteModalOpenChange = (open: boolean) => {
    if (!open) setDeleteTarget(null);
  };
  const isEditMode = checkedRowKeys.size > 0;
  const selectionFooter = (() => {
    if (!isEditMode) return null;
    return (
      <div className={styles.selectionActions}>
        {canBatchMove ? (
          <Button variant="secondary" size="sm" onPress={() => setMoveNodes(selectedActionTargets)}>
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
        <Button variant="secondary" size="sm" onPress={() => setCheckedRowKeys(new Set())}>
          {t('table.clearSelection')}
        </Button>
      </div>
    );
  })();
  const mountTagId = resolveCurrentFolderTagId(currentNodeId, pathNodes);
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
    mountTagId,
    isTrashView,
  });
  const toolbar = (
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
  );

  const handleRowActivate = (row: DriveTableRow, viewer?: ResourceViewer) => {
    handleClickNode(row.node, viewer);
  };

  const handleRowSelect = (row: DriveTableRow) => {
    if (row.node.type !== 'loading') {
      setSelectedRowId(row.id);
    }
  };

  const resolveRowActions = useTableDriveRowActions({
    groupId: finalGroupId,
    isEditMode,
    isTrashView,
    showManagePermission,
    onEnterFolder: handleEnterFolder,
    onOpenNode: handleClickNode,
    onRename: setRenameTarget,
    onMoveNodes: setMoveNodes,
    onDelete: setDeleteTarget,
    onOpenTagAccessPermission: openTagAccessPermission,
    onOpenTagMountPermission: openTagMountPermission,
    onOpenResourcePermission: openResourcePermission,
  });

  const breadcrumb = (() => {
    const items = toBreadcrumbItems(pathNodes);
    return (
      <>
        <FolderTable.Breadcrumb
          items={items}
          onJump={handleEnterFolder}
          renderItem={renderBreadcrumbItem}
        />
        {breadcrumbExtra}
      </>
    );
  })();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <main className={styles.listArea}>
        <div className={styles.driveFrame}>
          <div className={styles.driveBody}>
            <div className={styles.tablePanel}>
              <FolderTable<DriveTableRow>
                ariaLabel={t('table.aria')}
                items={rows}
                columns={columns}
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
                  onRename={setRenameTarget}
                  onMoveNodes={setMoveNodes}
                  onDelete={setDeleteTarget}
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
          <TrashDeleteModal
            isOpen={Boolean(deleteTarget)}
            node={deleteTarget}
            onOpenChange={handleDeleteModalOpenChange}
            onSuccess={handleNodeActionSuccess}
          />
        ) : (
          <DriveDeleteModal
            isOpen={Boolean(deleteTarget)}
            node={deleteTarget}
            groupId={finalGroupId}
            onOpenChange={handleDeleteModalOpenChange}
            onSuccess={handleNodeActionSuccess}
          />
        )}
      </main>
      <DragOverlay>
        {activeDragRow && draggingCount > 0 ? (
          <DriveDragOverlay row={activeDragRow} count={draggingCount} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TableDrive;
