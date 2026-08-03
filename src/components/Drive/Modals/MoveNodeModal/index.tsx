import { useDriveService } from '@/domains';
import type { FolderNode, IDriveService } from '@/domains/Drive';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { getDriveScopeGroupId, type DriveActionTarget } from '../../common/driveComponentModel';
import DriveFolderPickerModal from '../DriveFolderPickerModal';
import type { MoveNodeModalProps } from './index.type';

const getNodeName = (node: DriveActionTarget): string => {
  if (node.type === 'folder') return node.name;
  if (node.type === 'resource' || node.type === 'link') return node.title;
  return '';
};

async function collectFolderSubtreeNodeIds(
  driveService: IDriveService,
  folderId: string,
  groupId: string | undefined,
  disabledNodeIds: Set<string>,
  visitedFolderIds: Set<string>
): Promise<void> {
  if (visitedFolderIds.has(folderId)) return;
  visitedFolderIds.add(folderId);
  disabledNodeIds.add(folderId);

  const children = await driveService.listNodeChildren({
    nodeId: folderId,
    groupId,
  });
  children.forEach((child) => disabledNodeIds.add(child.id));
  const folderChildren = children.filter((child): child is FolderNode => child.type === 'folder');
  await Promise.all(
    folderChildren.map((child) =>
      collectFolderSubtreeNodeIds(
        driveService,
        child.id,
        groupId,
        disabledNodeIds,
        visitedFolderIds
      )
    )
  );
}

function MoveNodeModal({
  isOpen,
  nodes,
  rootId,
  groupId,
  isTrashView = false,
  onOpenChange,
  onSuccess,
}: MoveNodeModalProps) {
  const { t } = useTranslation(['drive', 'common']);
  const driveService = useDriveService();
  const nodeIdsKey = nodes.map((node) => node.id).join('\u0000');
  const effectiveRootId = nodes[0]?.scope.rootId ?? rootId;
  const effectiveGroupId = groupId ?? (nodes[0] ? getDriveScopeGroupId(nodes[0].scope) : undefined);

  const { data: descendantNodeIds } = useRequest(
    async (): Promise<Set<string>> => {
      const descendantIds = new Set<string>();
      const visitedFolderIds = new Set<string>();
      await Promise.all(
        nodes
          .filter(
            (node): node is Extract<DriveActionTarget, { type: 'folder' }> => node.type === 'folder'
          )
          .map((node) =>
            collectFolderSubtreeNodeIds(
              driveService,
              node.id,
              effectiveGroupId,
              descendantIds,
              visitedFolderIds
            )
          )
      );
      return descendantIds;
    },
    {
      ready: isOpen && nodes.length > 0,
      refreshDeps: [isOpen, nodeIdsKey, effectiveRootId, effectiveGroupId],
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const disabledTargetIds = (() => {
    const next = new Set(nodes.map((node) => node.id));
    for (const nodeId of descendantNodeIds ?? []) {
      next.add(nodeId);
    }
    if (
      effectiveGroupId &&
      nodes.some((node) => node.type === 'resource' || node.type === 'link')
    ) {
      next.add(effectiveRootId);
    }
    return next;
  })();

  const { loading: moving, run: runMove } = useRequest(
    async (selectedTargetId: string) => {
      if (nodes.length === 0) return 0;
      return await driveService.moveNodesToFolder({
        nodeIds: nodes.map((node) => node.id),
        targetFolderNodeId: selectedTargetId,
        groupId: effectiveGroupId,
      });
    },
    {
      manual: true,
      onSuccess: (movedCount, [selectedTargetId]) => {
        if (movedCount === 0) {
          toast.success(t('move.feedback.alreadyThere'));
          onOpenChange(false);
          return;
        }
        toast.success(
          isTrashView
            ? t('move.feedback.movedToDrive', { count: movedCount })
            : t('move.feedback.moved', { count: movedCount })
        );
        onSuccess?.(selectedTargetId);
        onOpenChange(false);
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  return (
    <DriveFolderPickerModal
      isOpen={isOpen && nodes.length > 0}
      title={isTrashView ? t('move.titleToDrive') : t('move.titleToFolder')}
      hint={
        nodes.length === 1
          ? t('move.selectedItem', { name: getNodeName(nodes[0]) })
          : t('move.selectedCount', { count: nodes.length })
      }
      rootId={effectiveRootId}
      groupId={effectiveGroupId}
      disabledNodeIds={[...disabledTargetIds]}
      isSubmitting={moving}
      confirmText={t('actions.confirm', { ns: 'common' })}
      cancelText={t('actions.cancel', { ns: 'common' })}
      onOpenChange={onOpenChange}
      onConfirm={(target) => runMove(target.nodeId)}
    />
  );
}

export default MoveNodeModal;
