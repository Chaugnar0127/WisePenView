import { useDriveService } from '@/domains';
import type { DriveNode, DriveNodeScope } from '@/domains/Drive';
import { useApi } from '@/hooks/useApi';
import { resolveTrashViewState } from '../trashViewModel';

interface UseTableDriveTrashControllerParams {
  currentNodeId: string;
  pathNodes: DriveNode[];
  scope: DriveNodeScope;
}

export function useTableDriveTrashController({
  currentNodeId,
  pathNodes,
  scope,
}: UseTableDriveTrashControllerParams) {
  const driveService = useDriveService();
  const canOpenTrash = scope.type === 'personal';
  const { data: trashFolder } = useApi(
    () => driveService.getSystemFolder({ scope, type: 'trash' }),
    {
      ready: canOpenTrash,
      refreshDeps: [scope.type],
    }
  );
  const trashFolderNodeId = trashFolder?.id;

  return resolveTrashViewState({
    canOpenTrash,
    currentNodeId,
    pathNodeIds: pathNodes.map((node) => node.id),
    trashFolderNodeId,
  });
}
