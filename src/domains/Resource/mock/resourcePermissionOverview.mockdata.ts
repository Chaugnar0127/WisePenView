import type {
  GetResourcePermissionOverviewRequest,
  ResourcePermissionOverview,
} from '@/domains/Resource';
import {
  filterSupportedResourcePermissionActions,
  getSupportedResourcePermissionActions,
  RESOURCE_ACTION,
} from '@/domains/Resource';

export const createMockResourcePermissionOverview = (
  params: GetResourcePermissionOverviewRequest
): ResourcePermissionOverview => {
  const resourceId = params.resourceId;
  const resourceType = params.resourceType;
  const supportedActions = getSupportedResourcePermissionActions(resourceType);
  const tagActions = filterSupportedResourcePermissionActions(
    [RESOURCE_ACTION.DISCOVER, RESOURCE_ACTION.VIEW, RESOURCE_ACTION.EDIT],
    supportedActions
  );
  const overrideActions = filterSupportedResourcePermissionActions(
    [RESOURCE_ACTION.DISCOVER, RESOURCE_ACTION.VIEW],
    supportedActions
  );
  const specifiedUserActions = filterSupportedResourcePermissionActions(
    [
      RESOURCE_ACTION.DISCOVER,
      RESOURCE_ACTION.VIEW,
      RESOURCE_ACTION.EDIT,
      RESOURCE_ACTION.DOWNLOAD_WATERMARK,
      RESOURCE_ACTION.DOWNLOAD_ORIGINAL,
      RESOURCE_ACTION.FORK,
    ],
    supportedActions
  );
  return {
    resourceId,
    resourceType,
    owner: {
      id: 'owner:1',
      kind: 'owner' as const,
      source: 'owner' as const,
      name: '陈思齐',
      description: '所有者',
      userId: '1',
      effectiveActions: supportedActions,
      editableActions: supportedActions,
      readonly: true,
    },
    subjects: [
      {
        id: 'group:wise-pen-dev:tag',
        kind: 'group' as const,
        source: 'tag' as const,
        name: 'WisePen 研发组',
        description: '继承自资源所在标签的权限',
        groupId: 'wise-pen-dev',
        primaryTagId: 'tag-work',
        effectiveActions: tagActions,
        editableActions: tagActions,
        inheritedActions: tagActions,
      },
      {
        id: 'group:agentic-sig:override',
        kind: 'group' as const,
        source: 'resourceOverride' as const,
        name: 'Agentic SIG',
        description: '已覆盖标签策略，仅对此资源生效',
        groupId: 'agentic-sig',
        primaryTagId: 'tag-work',
        effectiveActions: overrideActions,
        editableActions: overrideActions,
      },
      {
        id: 'user:10086:specified',
        kind: 'user' as const,
        source: 'specifiedUser' as const,
        name: '小明',
        description: '由您邀请而获得的权限',
        userId: '10086',
        effectiveActions: specifiedUserActions,
        editableActions: specifiedUserActions,
      },
    ],
    supportedActions,
    actionOptions: supportedActions.map((action) => ({
      action,
      key: RESOURCE_ACTION.getKey(action) ?? String(action),
      label: RESOURCE_ACTION.labels[action] ?? String(action),
      supported: true,
    })),
  };
};
