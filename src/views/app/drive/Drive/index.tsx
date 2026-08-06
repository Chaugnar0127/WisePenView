import TableDrive from '@/components/Drive/TableDrive';
import { useDriveService } from '@/domains';
import { buildDriveNodeScope } from '@/domains/Drive';
import { useWorkspaceNavigationStore } from '@/layouts/Workspace/_store/useWorkspaceNavigationStore';
import { parseErrorMessage } from '@/utils/error';
import {
  buildDrivePath,
  buildDriveSystemFolderPath,
  DRIVE_FAVORITES_PATH,
  DRIVE_TRASH_PATH,
  DRIVE_UPLOAD_QUEUE_PATH,
} from '@/utils/navigation/driveRoute';
import { Tabs, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useEffect, type Key } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import FavoritesTab from '../_components/FavoritesTab';
import UploadQueueTab from '../_components/UploadQueueTab';
import styles from './style.module.less';

export type DriveViewMode = 'uploadQueue' | 'tableDrive' | 'favorites' | 'trash';

interface DriveProps {
  viewMode?: DriveViewMode;
}

function Drive({ viewMode = 'tableDrive' }: DriveProps) {
  const { t } = useTranslation('drive');
  const navigate = useNavigate();
  const { folderId } = useParams();
  const driveService = useDriveService();
  const driveScope = buildDriveNodeScope();
  const workspaceScope = useWorkspaceNavigationStore((state) => state.location.scope);

  /**
   * @wisepen-manual-effect
   * 执行时机：URL 路由范围或云盘视图模式变化后同步 workspace scope。
   * 不可替代原因：React Router 与工作区 Zustand store 是两个独立状态系统。
   * cleanup：没有订阅或延迟任务，无需清理。
   */
  useEffect(() => {
    if (viewMode === 'uploadQueue' || viewMode === 'favorites') return;

    const nextScope = buildDriveNodeScope();
    const currentScope = useWorkspaceNavigationStore.getState().location.scope;
    const currentGroupId = currentScope.type === 'group' ? currentScope.groupId : undefined;
    const nextGroupId = nextScope.type === 'group' ? nextScope.groupId : undefined;
    if (currentScope.rootId === nextScope.rootId && currentGroupId === nextGroupId) {
      return;
    }
    useWorkspaceNavigationStore.getState().navigateToScope(nextScope);
  }, [viewMode]);

  const isTrashView = viewMode === 'trash';
  const handleTrashRootError = (error: unknown) => {
    toast.danger(parseErrorMessage(error));
  };

  const { data: trashFolderNodeId } = useRequest(() => driveService.getTrashFolderNodeId(), {
    ready: isTrashView && !folderId,
    refreshDeps: [viewMode, folderId],
    onError: handleTrashRootError,
  });

  const handleCurrentNodeChange = (nodeId: string) => {
    navigate(buildDrivePath({ scope: driveScope, nodeId }));
  };

  const handleViewModeChange = (nextViewMode: DriveViewMode) => {
    if (nextViewMode === viewMode) return;
    if (nextViewMode === 'uploadQueue') {
      navigate(DRIVE_UPLOAD_QUEUE_PATH);
      return;
    }
    if (nextViewMode === 'favorites') {
      navigate(DRIVE_FAVORITES_PATH);
      return;
    }
    if (nextViewMode === 'trash') {
      navigate(DRIVE_TRASH_PATH);
      return;
    }
    navigate(buildDrivePath({ scope: workspaceScope }));
  };

  const handleViewModeSelectionChange = (key: Key) => {
    const nextViewMode = String(key);
    if (
      nextViewMode === 'uploadQueue' ||
      nextViewMode === 'tableDrive' ||
      nextViewMode === 'favorites' ||
      nextViewMode === 'trash'
    ) {
      handleViewModeChange(nextViewMode);
    }
  };

  const initialNodeId = folderId ?? trashFolderNodeId;
  const isTrashPending = Boolean(isTrashView && !folderId && !trashFolderNodeId);
  const tableDriveLocationKey = `${driveScope.rootId}\u0000${initialNodeId ?? driveScope.rootId}`;

  const handleTrashNodeChange = (nodeId: string) => {
    if (viewMode !== 'trash') return;
    if (nodeId === driveScope.rootId) {
      navigate(buildDrivePath({ scope: driveScope }));
      return;
    }
    navigate(buildDriveSystemFolderPath({ view: viewMode, nodeId }));
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('page.title')}</h1>
        <span className={styles.pageSubtitle}>{t('page.subtitle')}</span>
      </header>

      <Tabs
        variant="secondary"
        selectedKey={viewMode}
        onSelectionChange={handleViewModeSelectionChange}
        className={styles.detailTabs}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('page.viewAria')}>
            {[
              { key: 'tableDrive', label: t('page.tabs.drive') },
              { key: 'uploadQueue', label: t('page.tabs.uploadQueue') },
              { key: 'favorites', label: t('page.tabs.favorites') },
              { key: 'trash', label: t('page.tabs.trash') },
            ].map((item) => (
              <Tabs.Tab key={item.key} id={item.key}>
                {item.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className={styles.previewContent}>
        {viewMode === 'tableDrive' && (
          <TableDrive
            key={tableDriveLocationKey}
            scope={driveScope}
            initialNodeId={folderId}
            onCurrentNodeChange={handleCurrentNodeChange}
          />
        )}
        {viewMode === 'uploadQueue' && <UploadQueueTab />}
        {viewMode === 'favorites' && <FavoritesTab />}
        {isTrashView ? (
          <TableDrive
            key={tableDriveLocationKey}
            scope={driveScope}
            initialNodeId={initialNodeId}
            loading={isTrashPending}
            onCurrentNodeChange={handleTrashNodeChange}
            onPathError={(error) => {
              toast.danger(parseErrorMessage(error));
              navigate(DRIVE_TRASH_PATH, { replace: true });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Drive;
