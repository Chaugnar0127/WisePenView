interface ResolveTrashViewStateParams {
  canOpenTrash: boolean;
  currentNodeId: string;
  pathNodeIds: string[];
  trashFolderNodeId?: string;
}

interface TrashViewState {
  isTrashView: boolean;
  isTrashRootView: boolean;
}

export function resolveTrashViewState({
  canOpenTrash,
  currentNodeId,
  pathNodeIds,
  trashFolderNodeId,
}: ResolveTrashViewStateParams): TrashViewState {
  const isTrashRootView = Boolean(
    canOpenTrash && trashFolderNodeId && currentNodeId === trashFolderNodeId
  );
  const isTrashView = Boolean(
    canOpenTrash &&
    trashFolderNodeId &&
    (isTrashRootView || pathNodeIds.includes(trashFolderNodeId))
  );

  return { isTrashView, isTrashRootView };
}
