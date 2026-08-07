import { DocumentApi } from '@/domains/Document/apis/DocumentApi';
import type { GroupBaseInfo, IGroupService } from '@/domains/Group';
import { NoteApi } from '@/domains/Note/apis/NoteApi';
import { SkillApi } from '@/domains/Skill/apis/SkillApi';
import type { TagTreeNode } from '@/domains/Tag';
import { TagApi } from '@/domains/Tag/apis/TagApi';
import { TagServicesMap } from '@/domains/Tag/mapper/TagServices.map';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';
import { type ResourceAction } from '../enum';
import { ResourceServicesMap } from '../mapper/ResourceServices.map';
import type {
  GetResourcePermissionOverviewRequest,
  ResourcePermissionGroupInfo,
  ResourcePermissionHydration,
  ResourcePermissionOverview,
} from './index.type';

export interface ResourcePermissionOverviewDeps {
  groupService: IGroupService;
}

const getPermissionResourceInfo = async (params: GetResourcePermissionOverviewRequest) => {
  switch (params.resourceType) {
    case 'note':
    case 'drawio': {
      const data = await NoteApi.getNoteInfo({ resourceId: params.resourceId });
      return data.resourceInfo;
    }
    case 'file': {
      const data = await DocumentApi.getDocInfo({ resourceId: params.resourceId });
      return data.resourceInfo;
    }
    case 'skill': {
      const data = await SkillApi.getSkillInfo({ resourceId: params.resourceId });
      return (
        data?.resourceInfo ?? { resourceId: params.resourceId, resourceName: '', ownerInfo: {} }
      );
    }
    case 'agent':
      throw createClientError(FRONTEND_CLIENT_ERROR.RESOURCE_AGENT_PERMISSION_UNSUPPORTED);
  }
};

const loadPermissionGroupInfo = async (
  overview: ResourcePermissionOverview,
  groupService: IGroupService
): Promise<ReadonlyMap<string, ResourcePermissionGroupInfo>> => {
  const groupIds = Array.from(
    new Set(
      overview.subjects
        .map((subject) => subject.groupId)
        .filter((groupId): groupId is string => Boolean(groupId))
    )
  );
  if (groupIds.length === 0) return new Map();

  const groupInfos = await Promise.all(
    groupIds.map((groupId) => groupService.fetchGroupBaseInfo(groupId).catch(() => undefined))
  );
  return new Map(
    groupInfos
      .filter((groupInfo): groupInfo is GroupBaseInfo => Boolean(groupInfo?.groupId))
      .map((groupInfo) => [
        groupInfo.groupId,
        {
          groupId: groupInfo.groupId,
          groupName: groupInfo.groupName,
          groupDesc: groupInfo.groupDesc,
          groupCoverUrl: groupInfo.groupCoverUrl,
        },
      ])
  );
};

const buildTagFlatMap = (roots: TagTreeNode[]): Map<string, TagTreeNode> => {
  const tagById = new Map<string, TagTreeNode>();
  const walk = (node: TagTreeNode) => {
    tagById.set(node.tagId, node);
    node.children?.forEach(walk);
  };
  roots.forEach(walk);
  return tagById;
};

/** TagService 反向依赖 ResourceService，此处复用 Tag API 与 mapper 避免 registry 循环。 */
const loadPermissionInheritedActions = async (
  overview: ResourcePermissionOverview
): Promise<ReadonlyMap<string, ResourceAction[]>> => {
  const subjectsByGroupId = new Map<string, ResourcePermissionOverview['subjects']>();
  overview.subjects.forEach((subject) => {
    if (!subject.groupId || !subject.primaryTagId) return;
    const subjects = subjectsByGroupId.get(subject.groupId) ?? [];
    subjects.push(subject);
    subjectsByGroupId.set(subject.groupId, subjects);
  });
  if (subjectsByGroupId.size === 0) return new Map();

  const inheritedActionsBySubjectId = new Map<string, ResourceAction[]>();
  await Promise.all(
    Array.from(subjectsByGroupId.entries()).map(async ([groupId, subjects]) => {
      const data = await TagApi.getTagTree(TagServicesMap.mapGetTagTreeRequest(groupId)).catch(
        () => undefined
      );
      if (!data) return;
      const tagById = buildTagFlatMap(TagServicesMap.mapTagTreeFromApi(data));
      subjects.forEach((subject) => {
        const inheritedActions = subject.primaryTagId
          ? tagById.get(subject.primaryTagId)?.grantedActions
          : undefined;
        if (inheritedActions) {
          inheritedActionsBySubjectId.set(subject.id, inheritedActions);
        }
      });
    })
  );
  return inheritedActionsBySubjectId;
};

const enrichResourcePermissionOverview = async (
  overview: ResourcePermissionOverview,
  deps: ResourcePermissionOverviewDeps
): Promise<ResourcePermissionOverview> => {
  const [groupInfoById, inheritedActionsBySubjectId] = await Promise.all([
    loadPermissionGroupInfo(overview, deps.groupService),
    loadPermissionInheritedActions(overview),
  ]);
  const userInfoById: ResourcePermissionHydration['userInfoById'] = new Map();
  const hydration: ResourcePermissionHydration = {
    userInfoById,
    groupInfoById,
    inheritedActionsBySubjectId,
  };
  return ResourceServicesMap.mergeResourcePermissionHydration(overview, hydration);
};

export const getResourcePermissionOverview = async (
  params: GetResourcePermissionOverviewRequest,
  deps: ResourcePermissionOverviewDeps
): Promise<ResourcePermissionOverview> => {
  const resourceInfo = await getPermissionResourceInfo(params);
  const overview = ResourceServicesMap.mapResourcePermissionOverviewFromApi(
    resourceInfo,
    params.resourceId
  );
  return enrichResourcePermissionOverview(overview, deps);
};
