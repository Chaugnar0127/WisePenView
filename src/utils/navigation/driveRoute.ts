import { buildDriveNodeScope, type DriveNodeScope } from '@/domains/Drive';

const APP_DRIVE_PATH = '/app/drive';
const PERSONAL_DRIVE_PATH = `${APP_DRIVE_PATH}/personal`;
const GROUP_DRIVE_PATH = `${APP_DRIVE_PATH}/group`;

export const DRIVE_UPLOAD_QUEUE_PATH = `${APP_DRIVE_PATH}/upload-queue`;
export const DRIVE_FAVORITES_PATH = `${APP_DRIVE_PATH}/favorites`;
export const DRIVE_TRASH_PATH = `${APP_DRIVE_PATH}/trash`;
export const DRIVE_SHARED_PATH = `${APP_DRIVE_PATH}/shared`;

export interface DriveRouteLocation {
  scope: DriveNodeScope;
  initialNodeId?: string;
}

export interface DriveRouteParams {
  groupId?: string;
  folderId?: string;
}

export const buildDrivePath = ({
  scope,
  nodeId,
}: {
  scope: DriveNodeScope;
  nodeId?: string;
}): string => {
  const folderPath =
    nodeId && nodeId !== scope.rootId ? `/folder/${encodeURIComponent(nodeId)}` : '';
  if (scope.type === 'group') {
    return `${GROUP_DRIVE_PATH}/${encodeURIComponent(scope.groupId)}${folderPath}`;
  }
  return `${PERSONAL_DRIVE_PATH}${folderPath}`;
};

export const buildDriveSystemFolderPath = ({
  view,
  nodeId,
}: {
  view: 'trash' | 'shared';
  nodeId?: string;
}): string => {
  const basePath = view === 'trash' ? DRIVE_TRASH_PATH : DRIVE_SHARED_PATH;
  return nodeId ? `${basePath}/folder/${encodeURIComponent(nodeId)}` : basePath;
};

export const parseDriveInitialNodeId = (search: string): string | undefined => {
  return new URLSearchParams(search).get('folder')?.trim() || undefined;
};

export const parseDriveRouteLocation = ({
  groupId,
  folderId,
}: DriveRouteParams): DriveRouteLocation => {
  const normalizedGroupId = groupId?.trim() || undefined;
  const initialNodeId = folderId?.trim() || undefined;

  return {
    scope: buildDriveNodeScope(normalizedGroupId),
    ...(initialNodeId ? { initialNodeId } : {}),
  };
};
