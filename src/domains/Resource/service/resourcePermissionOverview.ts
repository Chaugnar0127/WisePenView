import { AgentApi } from '@/domains/Agent/apis/AgentApi';
import { DocumentApi } from '@/domains/Document/apis/DocumentApi';
import type { GroupBaseInfo, IGroupService } from '@/domains/Group';
import { NoteApi } from '@/domains/Note/apis/NoteApi';
import { SkillApi } from '@/domains/Skill/apis/SkillApi';
import type { TagTreeNode } from '@/domains/Tag';
import { TagApi } from '@/domains/Tag/apis/TagApi';
import { TagServicesMap } from '@/domains/Tag/mapper/TagServices.map';
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

const PERMISSION_OVERVIEW_HYDRATION_CONCURRENCY = 10;

const normalizePermissionGroupHydrationLimit = (value: number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  return Math.max(0, Math.floor(value));
};

const runWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runNext = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  };

  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runNext()));
  return results;
};

const collectPermissionGroupIds = (
  overview: ResourcePermissionOverview,
  limit?: number
): string[] => {
  const groupIds: string[] = [];
  const seenGroupIds = new Set<string>();
  const normalizedLimit = normalizePermissionGroupHydrationLimit(limit);

  for (const subject of overview.subjects) {
    const groupId = subject.groupId;
    if (!groupId || seenGroupIds.has(groupId)) continue;
    groupIds.push(groupId);
    seenGroupIds.add(groupId);
    if (normalizedLimit !== undefined && groupIds.length >= normalizedLimit) break;
  }

  return groupIds;
};

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
    case 'agent': {
      const data = await AgentApi.getAgentInfo(params.resourceId);
      return (
        data?.resourceInfo ?? { resourceId: params.resourceId, resourceName: '', ownerInfo: {} }
      );
    }
  }
};

const loadPermissionGroupInfo = async (
  groupIds: string[],
  groupService: IGroupService
): Promise<ReadonlyMap<string, ResourcePermissionGroupInfo>> => {
  if (groupIds.length === 0) return new Map();

  const groupInfos = await runWithConcurrency(
    groupIds,
    PERMISSION_OVERVIEW_HYDRATION_CONCURRENCY,
    (groupId) => groupService.fetchGroupBaseInfo(groupId).catch(() => undefined)
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
  overview: ResourcePermissionOverview,
  groupIds: string[]
): Promise<ReadonlyMap<string, ResourceAction[]>> => {
  const groupIdSet = new Set(groupIds);
  const subjectsByGroupId = new Map<string, ResourcePermissionOverview['subjects']>();
  overview.subjects.forEach((subject) => {
    if (!subject.groupId || !subject.primaryTagId || !groupIdSet.has(subject.groupId)) return;
    const subjects = subjectsByGroupId.get(subject.groupId) ?? [];
    subjects.push(subject);
    subjectsByGroupId.set(subject.groupId, subjects);
  });
  if (subjectsByGroupId.size === 0) return new Map();

  const inheritedActionsBySubjectId = new Map<string, ResourceAction[]>();
  await runWithConcurrency(
    Array.from(subjectsByGroupId.entries()),
    PERMISSION_OVERVIEW_HYDRATION_CONCURRENCY,
    async ([groupId, subjects]) => {
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
    }
  );
  return inheritedActionsBySubjectId;
};

const enrichResourcePermissionOverview = async (
  overview: ResourcePermissionOverview,
  params: GetResourcePermissionOverviewRequest,
  deps: ResourcePermissionOverviewDeps
): Promise<ResourcePermissionOverview> => {
  const groupIds = collectPermissionGroupIds(overview, params.groupHydrationLimit);
  const [groupInfoById, inheritedActionsBySubjectId] = await Promise.all([
    loadPermissionGroupInfo(groupIds, deps.groupService),
    loadPermissionInheritedActions(overview, groupIds),
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
  return enrichResourcePermissionOverview(overview, params, deps);
};
