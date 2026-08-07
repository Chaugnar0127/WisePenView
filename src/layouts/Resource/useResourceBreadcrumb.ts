import {
  getDriveNodeLabel,
  getDriveScopeGroupId,
} from '@/components/Drive/common/driveComponentModel';
import type { AppBreadcrumbItem } from '@/components/Navigation/AppBreadcrumb';
import { useDriveService, useGroupService } from '@/domains';
import { buildDrivePath } from '@/utils/navigation/driveRoute';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { useResourceNavigationStore } from './_store/useResourceNavigationStore';

export function useResourceBreadcrumb(resourceId?: string) {
  const { t } = useTranslation('workspace');
  const driveService = useDriveService();
  const groupService = useGroupService();
  const location = useResourceNavigationStore((state) => state.location);
  const resourceLocation = location.resource;
  const hasMatchingLocation = Boolean(resourceId && resourceLocation?.resourceId === resourceId);
  const groupId = getDriveScopeGroupId(location.scope);

  const { data } = useRequest(
    async () => {
      const activeResourceLocation = resourceLocation!;
      const [pathNodes, group] = await Promise.all([
        driveService.getNodePath({
          nodeId: activeResourceLocation.parentNodeId,
          groupId,
        }),
        groupId ? groupService.fetchGroupBaseInfo(groupId) : Promise.resolve(undefined),
      ]);

      return {
        resourceId: activeResourceLocation.resourceId,
        parentNodeId: activeResourceLocation.parentNodeId,
        scopeRootId: location.scope.rootId,
        items: pathNodes.map<AppBreadcrumbItem>((node, index) => ({
          key: node.id,
          label:
            index === 0
              ? group?.groupName ||
                (groupId ? t('breadcrumb.unnamedGroup') : t('breadcrumb.personalDrive'))
              : getDriveNodeLabel(node),
          to: buildDrivePath({ scope: location.scope, nodeId: node.id }),
        })),
      };
    },
    {
      ready: hasMatchingLocation,
      refreshDeps: [
        resourceId,
        resourceLocation?.resourceId,
        resourceLocation?.parentNodeId,
        location.scope.rootId,
        groupId,
        t,
      ],
    }
  );

  const items =
    hasMatchingLocation &&
    data?.resourceId === resourceId &&
    data?.parentNodeId === resourceLocation?.parentNodeId &&
    data?.scopeRootId === location.scope.rootId
      ? data.items
      : [];

  return items;
}
