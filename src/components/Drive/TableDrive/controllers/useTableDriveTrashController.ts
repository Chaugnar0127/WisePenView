import { useDriveService } from '@/domains';
import type { DriveNode } from '@/domains/Drive';
import { useRequest } from 'ahooks';
import type { DriveScope } from '../../common/driveComponentModel';

interface UseTableDriveTrashControllerParams {
  currentNodeId: string;
  pathNodes: DriveNode[];
  scope: DriveScope;
}

export function useTableDriveTrashController({
  currentNodeId,
  pathNodes,
  scope,
}: UseTableDriveTrashControllerParams) {
  const driveService = useDriveService();
  const canOpenTrash = scope.type === 'personal';
  const { data: trashFolderNodeId } = useRequest(() => driveService.getTrashFolderNodeId(), {
    ready: canOpenTrash,
    refreshDeps: [scope.type],
  });
  const isTrashView = Boolean(
    canOpenTrash &&
    trashFolderNodeId &&
    (currentNodeId === trashFolderNodeId || pathNodes.some((node) => node.id === trashFolderNodeId))
  );

  return { isTrashView };
}
