import { useDriveService } from '@/domains';
import type { DriveNode, DriveNodeScope } from '@/domains/Drive';
import { useApi } from '@/hooks/useApi';

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
  const isTrashView = Boolean(
    canOpenTrash &&
    trashFolderNodeId &&
    (currentNodeId === trashFolderNodeId || pathNodes.some((node) => node.id === trashFolderNodeId))
  );

  return { isTrashView };
}
