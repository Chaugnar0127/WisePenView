import type { CourseOutlineEditorNode } from '@/domains/Course/entity/course';
import { GROUP_TYPE, type IGroupService } from '@/domains/Group';
import type { IInteractService } from '@/domains/Interact';
import type { IResourceService } from '@/domains/Resource';
import { RESOURCE_SORT_BY, RESOURCE_SORT_DIR } from '@/domains/Resource';
import type { ITagService } from '@/domains/Tag';
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

const mapOutlineEditorNodes = async (
  tagService: ITagService,
  tags: Awaited<ReturnType<ITagService['getTagTree']>>
): Promise<CourseOutlineEditorNode[]> =>
  Promise.all(
    tags.map(async (tag) => {
      const data = await tagService.getResByTag({ tag, filePage: 1, filePageSize: 100 });
      return {
        nodeId: tag.tagId,
        name: tag.tagName,
        entryType: 'folder' as const,
        parentId: tag.parentId,
        children: [
          ...(await mapOutlineEditorNodes(tagService, data.tags)),
          ...data.files.map((resource) => ({
            nodeId: `${tag.tagId}:${resource.resourceId}`,
            name: resource.resourceName,
            entryType: 'resource' as const,
            resourceId: resource.resourceId,
            resourceType: resource.resourceType,
            parentId: tag.tagId,
          })),
        ],
      };
    })
  );

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
    const groups = (await groupService.fetchAllMyGroups()).filter(
      (group) => group.groupType === GROUP_TYPE.ADVANCED
    );
    const start = Math.max(0, (page - 1) * size);
    const pageGroups = groups.slice(start, start + size);
    const list = await Promise.all(
      pageGroups.map(async (group) =>
        CourseServicesMap.mapGroupToCourseSummary(
          group,
          await groupService.fetchMyRoleInGroup(group.groupId)
        )
      )
    );
    return { list, total: groups.length, page, size };
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

  const getCourseOutlineEditor = async (courseId: string): Promise<CourseOutlineEditorNode[]> => {
    const group = await groupService.fetchGroupInfo(courseId);
    const courseMeta = CourseServicesMap.parseCourseMeta(group.groupMetaInfo);
    if (!courseMeta.outlineRootTagId) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, { courseId });
    }
    const tags = await tagService.getTagTree(courseId);
    const outlineRoot = tags.find((tag) => tag.tagId === courseMeta.outlineRootTagId);
    if (!outlineRoot) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
        courseId,
        outlineRootTagId: courseMeta.outlineRootTagId,
      });
    }
    const nodes = await mapOutlineEditorNodes(tagService, outlineRoot.children ?? []);
    return nodes.map((node) => ({ ...node, parentId: undefined }));
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

  const updateCourseResourceMount = async (
    courseId: string,
    resourceId: string,
    sourceNodeId: string,
    targetNodeId?: string
  ) => {
    const page = await resourceService.getGroupResources({
      groupId: courseId,
      page: 1,
      size: 100,
      sortBy: RESOURCE_SORT_BY.UPDATE_TIME,
      sortDir: RESOURCE_SORT_DIR.DESC,
      tagIds: [sourceNodeId],
      tagQueryLogicMode: 'AND',
    });
    const resource = page.list.find((item) => item.resourceId === resourceId);
    if (!resource) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, { resourceId });
    }
    const remainingTagIds = Object.keys(resource.currentTags ?? {}).filter(
      (tagId) => tagId !== sourceNodeId && tagId !== targetNodeId
    );
    const nextTagIds = targetNodeId ? [targetNodeId, ...remainingTagIds] : remainingTagIds;
    await resourceService.updateResourceTags({
      resourceId,
      groupId: courseId,
      tagIds: nextTagIds,
      ...(resource.mainTagId === sourceNodeId && nextTagIds[0]
        ? { primaryTagId: nextTagIds[0] }
        : {}),
    });
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
    getCourseHome: unavailable,
    listCourseAnnouncements: unavailable,
    getCourseOutline: unavailable,
    setResourceRead: ({ resourceId }) => interactService.recordResourceRead(resourceId),
    listCourseMembers,
    createCourse,
    updateCourse,
    getCourseOutlineEditor,
    createCourseOutlineSection,
    renameCourseOutlineSection: ({ courseId, nodeId, name }) =>
      tagService.updateTag({ groupId: courseId, targetTagId: nodeId, tagName: name }),
    deleteCourseOutlineSection: ({ courseId, nodeId }) =>
      tagService.deleteTag({ groupId: courseId, targetTagId: nodeId }),
    reorderCourseOutlineSections: ({ courseId, orderedNodeIds }) =>
      tagService.reorderSiblingTags({ groupId: courseId, orderedTagIds: orderedNodeIds }),
    mountCourseOutlineResources: ({ courseId, targetNodeId, resources }) =>
      resourceService.mountResourcesToGroupTag({
        groupId: courseId,
        tagId: targetNodeId,
        resourceIds: resources.map((resource) => resource.resourceId),
      }),
    moveCourseOutlineResource: ({ courseId, resourceId, sourceNodeId, targetNodeId }) =>
      updateCourseResourceMount(courseId, resourceId, sourceNodeId, targetNodeId),
    removeCourseOutlineResource: ({ courseId, resourceId, sourceNodeId }) =>
      updateCourseResourceMount(courseId, resourceId, sourceNodeId),
    joinCourse: (params) => groupService.joinGroup(params),
    listCourseAssignments: unavailable,
    getCourseAssignment: unavailable,
    submitCourseAssignment: unavailable,
  };
};
