import { GROUP_TYPE, type IGroupService } from '@/domains/Group';
import type { IInteractService } from '@/domains/Interact';
import type { IResourceService, ResourceItem } from '@/domains/Resource';
import { RESOURCE_SORT_BY, RESOURCE_SORT_DIR, TAG_QUERY_LOGIC_MODE } from '@/domains/Resource';
import type { ITagService, TagTreeNode } from '@/domains/Tag';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';
import { CourseServicesMap } from '../mapper/CourseServices.map';
import type {
  CreateCourseRequest,
  ICourseService,
  ListCourseMembersRequest,
  ListMyCoursesRequest,
  UpdateCourseRequest,
} from './index.type';

const unavailable = async (..._args: unknown[]): Promise<never> => {
  throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_SERVICE_UNAVAILABLE);
};

const COURSE_RESOURCE_PAGE_SIZE = 100;
const findTag = (nodes: TagTreeNode[], tagId: string): TagTreeNode | undefined => {
  for (const node of nodes) {
    if (node.tagId === tagId) return node;
    const child = findTag(node.children ?? [], tagId);
    if (child) return child;
  }
  return undefined;
};

interface CourseServicesDeps {
  groupService: IGroupService;
  interactService: IInteractService;
  resourceService: IResourceService;
  tagService: ITagService;
}

/** Course 是高级组的前端聚合视图，不拥有独立 API。 */
export const createCourseServices = (deps: CourseServicesDeps): ICourseService => {
  const { groupService, interactService, resourceService, tagService } = deps;

  const listMyCourses = async ({ page, size }: ListMyCoursesRequest) => {
    const data = await groupService.fetchGroupList({
      groupRoleFilter: 'ALL',
      groupType: GROUP_TYPE.ADVANCED,
      page,
      size,
    });
    return {
      list: data.groups.map(CourseServicesMap.mapGroupToCourseSummary),
      total: data.total,
      page: data.page,
      size: data.size,
    };
  };

  const getCourseDetail = async (courseId: string) => {
    const group = await groupService.fetchGroupInfo(courseId);
    if (group.groupType !== GROUP_TYPE.ADVANCED) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_NOT_FOUND, { courseId });
    }
    const role = await groupService.fetchMyRoleInGroup(courseId);
    return CourseServicesMap.mapGroupToCourseDetail(group, role);
  };

  const createCourse = async (params: CreateCourseRequest): Promise<string> => {
    const initialMetaInfo = CourseServicesMap.serializeCourseMeta(params);
    const courseId = await groupService.createGroup({
      groupName: params.name,
      groupType: GROUP_TYPE.ADVANCED,
      groupDesc: params.description,
      groupMetaInfo: initialMetaInfo,
    });
    const outlineRootTagId = await tagService.addTag({
      groupId: courseId,
      tagName: '大纲内容',
    });
    await groupService.editGroup({
      groupId: courseId,
      groupName: params.name,
      groupDesc: params.description,
      groupMetaInfo: CourseServicesMap.serializeCourseMeta({ ...params, outlineRootTagId }),
      groupCoverUrl: '',
      groupType: GROUP_TYPE.ADVANCED,
    });
    return courseId;
  };

  const updateCourse = async (params: UpdateCourseRequest): Promise<void> => {
    const group = await groupService.fetchGroupInfo(params.courseId);
    const currentCourseMeta = CourseServicesMap.parseCourseMeta(group.groupMetaInfo);
    await groupService.editGroup({
      groupId: params.courseId,
      groupName: params.name,
      groupDesc: params.description,
      groupCoverUrl: params.coverUrl ?? group.groupCoverUrl,
      groupType: GROUP_TYPE.ADVANCED,
      groupMetaInfo: CourseServicesMap.serializeCourseMeta(
        {
          ...params,
          outlineRootTagId: currentCourseMeta.outlineRootTagId,
        },
        group.groupMetaInfo
      ),
    });
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    await groupService.deleteGroup({ groupId: courseId });
  };

  const getCourseOutlineRoot = async (courseId: string): Promise<TagTreeNode> => {
    const [group, tags] = await Promise.all([
      groupService.fetchGroupInfo(courseId),
      tagService.getTagTree(courseId),
    ]);
    if (group.groupType !== GROUP_TYPE.ADVANCED) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_NOT_FOUND, { courseId });
    }
    const outlineRootTagId = CourseServicesMap.parseCourseMeta(
      group.groupMetaInfo
    ).outlineRootTagId;
    if (!outlineRootTagId) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, { courseId });
    }
    const outlineRoot = findTag(tags, outlineRootTagId);
    if (!outlineRoot) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
        courseId,
        outlineRootTagId,
      });
    }
    return outlineRoot;
  };

  const listCourseOutlineResources = async (courseId: string, tagIds: string[]) => {
    if (tagIds.length === 0) return [];
    const resources: ResourceItem[] = [];
    let page = 1;

    while (true) {
      const result = await resourceService.getGroupResources({
        groupId: courseId,
        page,
        size: COURSE_RESOURCE_PAGE_SIZE,
        sortBy: RESOURCE_SORT_BY.UPDATE_TIME,
        sortDir: RESOURCE_SORT_DIR.DESC,
        tagIds,
        tagQueryLogicMode: TAG_QUERY_LOGIC_MODE.OR,
        includeMyInteraction: true,
      });
      resources.push(...result.list);

      const reachedKnownTotal = result.total > 0 && resources.length >= result.total;
      const reachedKnownLastPage = result.totalPage > 0 && page >= result.totalPage;
      const reachedShortPage = result.list.length < COURSE_RESOURCE_PAGE_SIZE;
      if (reachedKnownTotal || reachedKnownLastPage || reachedShortPage) break;
      page += 1;
    }

    return resources;
  };

  const getCourseOutline: ICourseService['getCourseOutline'] = async (courseId) => {
    const outlineRoot = await getCourseOutlineRoot(courseId);
    const outlineTags = outlineRoot.children ?? [];
    const tagIds = CourseServicesMap.collectCourseOutlineTagIds(outlineTags);
    const resources = await listCourseOutlineResources(courseId, tagIds);
    return {
      courseId,
      nodes: CourseServicesMap.mapCourseOutlineNodes(outlineTags, resources),
    };
  };

  const getCourseHome: ICourseService['getCourseHome'] = async (courseId) => {
    const outline = await getCourseOutline(courseId);
    return {
      progress: CourseServicesMap.calculateCourseOutlineProgress(outline.nodes),
      pendingAssignments: [],
      announcements: [],
    };
  };

  const getCourseOutlineEditor: ICourseService['getCourseOutlineEditor'] = async (courseId) => {
    const outline = await getCourseOutline(courseId);
    return CourseServicesMap.mapCourseOutlineEditorNodes(outline.nodes);
  };

  const createCourseOutlineSection: ICourseService['createCourseOutlineSection'] = async ({
    courseId,
    parentId,
    name,
  }) => {
    let targetParentId = parentId;
    if (!targetParentId) {
      const group = await groupService.fetchGroupInfo(courseId);
      targetParentId = CourseServicesMap.parseCourseMeta(group.groupMetaInfo).outlineRootTagId;
      if (!targetParentId) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_NOT_FOUND, { courseId });
      }
    }
    return tagService.addTag({ groupId: courseId, parentId: targetParentId, tagName: name });
  };

  const listCourseMembers = async ({ courseId, page, size }: ListCourseMembersRequest) => {
    const groupMembers = await groupService.fetchGroupMembers(courseId, page, size);
    return {
      members: groupMembers.members.map(CourseServicesMap.mapGroupMemberToCourseMember),
      total: groupMembers.total,
    };
  };

  return {
    listMyCourses,
    getCourseDetail,
    getCourseHome,
    listCourseAnnouncements: unavailable,
    getCourseOutline,
    setResourceRead: ({ resourceId }) => interactService.recordResourceRead(resourceId),
    listCourseMembers,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseOutlineEditor,
    createCourseOutlineSection,
    renameCourseOutlineSection: ({ courseId, nodeId, name }) =>
      tagService.updateTag({ groupId: courseId, targetTagId: nodeId, tagName: name }),
    updateCourseOutlineSectionDescription: ({ courseId, nodeId, description }) =>
      tagService.updateTag({ groupId: courseId, targetTagId: nodeId, tagDesc: description }),
    deleteCourseOutlineSection: ({ courseId, nodeId }) =>
      tagService.removeTags({ groupId: courseId, targetTagIds: [nodeId] }),
    reorderCourseOutlineSections: ({ courseId, orderedNodeIds }) =>
      tagService.reorderSiblingTags({ groupId: courseId, orderedTagIds: orderedNodeIds }),
    mountCourseOutlineResources: unavailable,
    moveCourseOutlineResource: unavailable,
    removeCourseOutlineResource: unavailable,
    joinCourse: (params) => groupService.joinGroup(params),
    listCourseAssignments: unavailable,
    getCourseAssignment: unavailable,
    submitCourseAssignment: unavailable,
  };
};
