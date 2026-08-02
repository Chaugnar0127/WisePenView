import type {
  CourseAnnouncement,
  CourseAssignmentDetail,
  CourseAssignmentPreview,
  CourseDetail,
  CourseHomeSnapshot,
  CourseMember,
  CourseOutline,
  CourseOutlineEditorNode,
  CourseOutlineNode,
  CourseSummary,
  CreateCourseRequest,
  ICourseService,
} from '@/domains/Course';
import {
  COURSE_ASSIGNMENT_STATUS,
  COURSE_ROLE,
  createDefaultCourseAssessmentItems,
  formatCoursePeriodRange,
  getCoursePeriodTimeRange,
} from '@/domains/Course';
import type { Group } from '@/domains/Group';
import { GROUP_TYPE } from '@/domains/Group';
import {
  findMockGroup,
  replaceMockAdvancedGroups,
  upsertMockGroup,
} from '@/domains/Group/mock/groupStore.mock';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';

const NETWORK_DELAY_MS = 180;
const PRIMARY_COURSE_ID = 'course-data-structures';

const delay = async () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, NETWORK_DELAY_MS));
const clone = <T>(value: T): T => structuredClone(value);

const mapCourseDetailToGroup = (detail: CourseDetail): Group => {
  const current = findMockGroup(detail.courseId);
  return {
    groupId: detail.courseId,
    groupName: detail.name,
    groupDesc: detail.description,
    groupCoverUrl: detail.coverUrl ?? '',
    groupMetaInfo: {
      ...(current?.groupMetaInfo ?? {}),
      course: {
        schema: 'wisepen.course.v1',
        term: detail.term,
        category: detail.category,
        startAt: detail.startAt,
        endAt: detail.endAt,
        outlineRootTagId: `outline-root-${detail.courseId}`,
        learningObjectives: detail.learningObjectives,
        meetings: detail.meetings,
        assessmentItems: detail.assessmentItems,
        finalAssessment: detail.finalAssessment,
      },
    },
    groupType: GROUP_TYPE.ADVANCED,
    ownerId: detail.teacher.userId,
    ownerInfo: {
      nickname: detail.teacher.name,
      realName: detail.teacher.name,
      avatar: detail.teacher.avatar,
      identityType: 2,
    },
    memberCount: detail.memberCount,
    createTime: current?.createTime ?? '2026-02-20T00:00:00.000Z',
    inviteCode: current?.inviteCode ?? `COURSE-${detail.courseId}`,
    tokenUsed: current?.tokenUsed ?? 0,
    tokenBalance: current?.tokenBalance ?? 1000,
  };
};

const syncCourseBaseInfoFromGroup = (detail: CourseDetail): void => {
  const group = findMockGroup(detail.courseId);
  if (!group) return;
  detail.name = group.groupName;
  detail.description = group.groupDesc;
  detail.coverUrl = group.groupCoverUrl || undefined;
};

const teacher = {
  userId: 'teacher-chen',
  name: '陈明远',
  department: '计算机学院',
};

const initialDetails: CourseDetail[] = [
  {
    courseId: PRIMARY_COURSE_ID,
    name: '数据结构与算法',
    description: '从抽象数据类型到经典算法，理解数据组织、问题建模与程序效率之间的关系。',
    term: '2026 春季',
    category: '必修课',
    myRole: COURSE_ROLE.TEACHER,
    readResourceCount: 4,
    totalResourceCount: 9,
    pendingAssignmentCount: 2,
    teacherName: teacher.name,
    teacher,
    startAt: '2026-03-02T00:00:00+08:00',
    endAt: '2026-07-03T23:59:59+08:00',
    meetingSchedule: '周二 3、4节 09:55–11:35',
    location: '博学楼 A203',
    meetings: [
      {
        meetingId: 'meeting-tuesday',
        weekPattern: 'EVERY',
        weekday: '周二',
        startPeriod: 3,
        endPeriod: 4,
        location: '博学楼 A203',
      },
    ],
    learningObjectives: [
      '理解线性结构、树、图、查找和排序等常用数据结构与经典算法。',
      '能够根据问题约束选择合适的数据结构，并分析时间与空间复杂度。',
      '能够完成核心数据结构的实现、测试与工程化应用。',
    ],
    assessmentItems: createDefaultCourseAssessmentItems(),
    finalAssessment: {
      type: 'EXAM',
      examForm: '闭卷',
      date: '2026-06-29',
      startTime: '13:30',
      endTime: '15:30',
      location: '光华楼西辅楼 201',
    },
    teachingWeek: 8,
    memberCount: 86,
  },
  {
    courseId: 'course-computer-networks',
    name: '计算机网络',
    description: '理解分层网络体系、核心协议与现代互联网基础设施。',
    term: '2026 春季',
    category: '必修课',
    myRole: COURSE_ROLE.STUDENT,
    readResourceCount: 17,
    totalResourceCount: 25,
    pendingAssignmentCount: 1,
    teacherName: '周静',
    teacher: { userId: 'teacher-zhou', name: '周静', department: '计算机学院' },
    startAt: '2026-03-02T00:00:00+08:00',
    endAt: '2026-07-03T23:59:59+08:00',
    meetingSchedule: '周一、周三 14:00 - 15:40',
    location: '博学楼 B305',
    meetings: [
      {
        meetingId: 'meeting-monday',
        weekPattern: 'EVERY',
        weekday: '周一',
        startPeriod: 6,
        endPeriod: 7,
        location: '博学楼 B305',
      },
    ],
    learningObjectives: [
      '理解分层网络体系与端到端通信的基本原理。',
      '能够分析常见网络协议及其工程取舍。',
    ],
    assessmentItems: [
      { label: '实验', weight: 30 },
      { label: '期中考试', weight: 20 },
      { label: '期末考试', weight: 50 },
    ],
    teachingWeek: 8,
    memberCount: 72,
  },
  {
    courseId: 'course-database-systems',
    name: '数据库系统',
    description: '数据库系统原理、关系模型、查询处理与事务管理。',
    term: '2025 秋季',
    category: '专业选修',
    myRole: COURSE_ROLE.TEACHER,
    readResourceCount: 24,
    totalResourceCount: 24,
    pendingAssignmentCount: 0,
    teacherName: 'only317',
    teacher: { userId: 'current-user', name: 'only317', department: '计算机学院' },
    startAt: '2025-09-01T00:00:00+08:00',
    endAt: '2026-01-09T23:59:59+08:00',
    meetingSchedule: '周五 14:00 - 16:35',
    location: '实验楼 C401',
    meetings: [
      {
        meetingId: 'meeting-friday',
        weekPattern: 'EVERY',
        weekday: '周五',
        startPeriod: 6,
        endPeriod: 8,
        location: '实验楼 C401',
      },
    ],
    learningObjectives: ['掌握关系模型、查询处理和事务管理的基本原理。'],
    assessmentItems: [
      { label: '课程项目', weight: 40 },
      { label: '期末考试', weight: 60 },
    ],
    teachingWeek: 18,
    memberCount: 64,
  },
];

const outlineTemplates: Record<string, CourseOutlineNode[]> = {
  [PRIMARY_COURSE_ID]: [
    {
      nodeId: 'chapter-1',
      nodeType: 'CHAPTER',
      title: '第一章 课程概览',
      children: [
        {
          nodeId: 'intro',
          nodeType: 'RESOURCE',
          title: '课程导学',
          resourceId: 'mock-note-1',
          resourceType: 'note',
          durationLabel: '8 分钟',
          read: true,
        },
        {
          nodeId: 'syllabus',
          nodeType: 'RESOURCE',
          title: '课程安排与评分说明',
          resourceId: 'mock-course-syllabus',
          resourceType: 'file',
          viewer: 'pdf-preview',
          read: true,
        },
      ],
    },
    {
      nodeId: 'chapter-2',
      nodeType: 'CHAPTER',
      title: '第二章 线性结构',
      children: [
        {
          nodeId: 'section-21',
          nodeType: 'SECTION',
          title: '2.1 线性表',
          children: [
            {
              nodeId: 'video-list',
              nodeType: 'RESOURCE',
              title: '线性表的基本概念',
              resourceId: 'mock-video-list',
              resourceType: 'file',
              viewer: 'video',
              durationLabel: '18 分钟',
              read: true,
            },
            {
              nodeId: 'note-list',
              nodeType: 'RESOURCE',
              title: '顺序表与链表笔记',
              resourceId: 'mock-note-2',
              resourceType: 'note',
              durationLabel: '12 分钟',
              read: true,
            },
          ],
        },
        {
          nodeId: 'section-22',
          nodeType: 'SECTION',
          title: '2.2 栈与队列',
          children: [
            {
              nodeId: 'video-stack',
              nodeType: 'RESOURCE',
              title: '栈的实现与应用',
              resourceId: 'mock-video-stack',
              resourceType: 'file',
              viewer: 'video',
              durationLabel: '22 分钟',
              read: false,
            },
            {
              nodeId: 'pdf-queue',
              nodeType: 'RESOURCE',
              title: '队列补充阅读',
              resourceId: 'mock-pdf-queue',
              resourceType: 'file',
              viewer: 'pdf-preview',
              read: false,
            },
          ],
        },
      ],
    },
    {
      nodeId: 'chapter-3',
      nodeType: 'CHAPTER',
      title: '第三章 树与图',
      children: [
        {
          nodeId: 'video-tree',
          nodeType: 'RESOURCE',
          title: '二叉树遍历',
          resourceId: 'mock-video-tree',
          resourceType: 'file',
          viewer: 'video',
          durationLabel: '24 分钟',
          read: false,
        },
        {
          nodeId: 'note-graph',
          nodeType: 'RESOURCE',
          title: '图的存储结构',
          resourceId: 'mock-note-graph',
          resourceType: 'note',
          durationLabel: '15 分钟',
          read: false,
        },
      ],
    },
    {
      nodeId: 'chapter-4',
      nodeType: 'CHAPTER',
      title: '第四章 查找与排序',
      children: [
        {
          nodeId: 'pdf-sort',
          nodeType: 'RESOURCE',
          title: '排序算法对照表',
          resourceId: 'mock-pdf-sort',
          resourceType: 'file',
          viewer: 'pdf-preview',
          read: false,
        },
      ],
    },
  ],
};

const initialAssignments: Record<string, CourseAssignmentDetail[]> = {
  [PRIMARY_COURSE_ID]: [
    {
      assignmentId: 'assignment-linked-list',
      title: '作业一：链表操作',
      scopeLabel: '第二章 · 2.1 线性表',
      deadline: '2026-07-27T23:59:00+08:00',
      status: COURSE_ASSIGNMENT_STATUS.PENDING,
      description: '实现单链表的插入、删除、查找与反转，并说明各操作的时间复杂度。',
      submittedFileNames: [],
    },
    {
      assignmentId: 'assignment-stack-queue',
      title: '练习二：栈与队列',
      scopeLabel: '第二章 · 2.2 栈与队列',
      deadline: '2026-07-31T23:59:00+08:00',
      status: COURSE_ASSIGNMENT_STATUS.PENDING,
      description: '完成栈和循环队列的基础实现，并提交测试结果。',
      submittedFileNames: [],
    },
    {
      assignmentId: 'assignment-complexity',
      title: '课堂练习：复杂度分析',
      scopeLabel: '第一章 · 课程概览',
      deadline: '2026-07-18T23:59:00+08:00',
      status: COURSE_ASSIGNMENT_STATUS.SUBMITTED,
      description: '分析给定代码片段的时间复杂度。',
      submittedFileNames: ['complexity.pdf'],
      submittedAt: '2026-07-18T19:20:00+08:00',
    },
  ],
};

const announcements: Record<string, CourseAnnouncement[]> = {
  [PRIMARY_COURSE_ID]: [
    {
      announcementId: 'announcement-2',
      title: '第二章学习安排',
      content: '请在周四课程前完成线性表相关内容，并按时提交链表操作作业。',
      publisher: teacher,
      publishTime: '2026-07-24T09:00:00+08:00',
      pinned: true,
    },
    {
      announcementId: 'announcement-materials',
      title: '课程资料已更新',
      content: '课程组资料中已上传第 1-2 周课堂课件。',
      publisher: teacher,
      publishTime: '2026-07-20T15:30:00+08:00',
      pinned: false,
    },
  ],
};

const courseMembers: Record<string, CourseMember[]> = {
  [PRIMARY_COURSE_ID]: [
    {
      userId: teacher.userId,
      name: teacher.name,
      email: 'chen.mingyuan@wisepen.edu.cn',
      role: COURSE_ROLE.TEACHER,
    },
    {
      userId: 'assistant-zhou',
      name: '周雨',
      email: 'zhou.yu@wisepen.edu.cn',
      studentNumber: '2023123008',
      role: COURSE_ROLE.ASSISTANT,
    },
    {
      userId: 'current-user',
      name: 'only317',
      email: 'only317@wisepen.edu.cn',
      studentNumber: '2023123017',
      role: COURSE_ROLE.STUDENT,
    },
    {
      userId: 'student-wang',
      name: '王晨',
      email: 'wang.chen@wisepen.edu.cn',
      studentNumber: '2023123021',
      role: COURSE_ROLE.STUDENT,
    },
  ],
};

const toSummary = (detail: CourseDetail): CourseSummary => {
  const {
    assessmentItems: _assessmentItems,
    finalAssessment: _finalAssessment,
    endAt: _endAt,
    learningObjectives: _learningObjectives,
    location: _location,
    meetings: _meetings,
    meetingSchedule: _meetingSchedule,
    startAt: _startAt,
    teacher: _teacher,
    teachingWeek: _teachingWeek,
    memberCount: _memberCount,
    outlineRootTagId: _outlineRootTagId,
    ...summary
  } = detail;
  return summary;
};

function markResourceRead(nodes: CourseOutlineNode[], resourceId: string): boolean {
  let found = false;
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') {
      if (node.resourceId === resourceId) {
        node.read = true;
        found = true;
      }
    } else if (markResourceRead(node.children, resourceId)) {
      found = true;
    }
  }
  return found;
}

function countReadResources(nodes: CourseOutlineNode[]): { read: number; total: number } {
  const resources = new Map<string, boolean>();
  const collect = (items: CourseOutlineNode[]) => {
    for (const node of items) {
      if (node.nodeType === 'RESOURCE') {
        resources.set(node.resourceId, Boolean(resources.get(node.resourceId)) || node.read);
      } else {
        collect(node.children);
      }
    }
  };
  collect(nodes);
  let read = 0;
  for (const isRead of resources.values()) {
    if (isRead) read += 1;
  }
  return { read, total: resources.size };
}

const toEditorNodes = (nodes: CourseOutlineNode[], parentId?: string): CourseOutlineEditorNode[] =>
  nodes.map((node) =>
    node.nodeType === 'RESOURCE'
      ? {
          nodeId: node.nodeId,
          name: node.title,
          entryType: 'resource',
          resourceId: node.resourceId,
          resourceType: node.resourceType,
          parentId,
        }
      : {
          nodeId: node.nodeId,
          name: node.title,
          entryType: 'folder',
          parentId,
          children: toEditorNodes(node.children, node.nodeId),
        }
  );

const findOutlineContainer = (
  nodes: CourseOutlineNode[],
  nodeId: string
): Extract<CourseOutlineNode, { nodeType: 'CHAPTER' | 'SECTION' }> | undefined => {
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') continue;
    if (node.nodeId === nodeId) return node;
    const child = findOutlineContainer(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
};

const deleteOutlineNode = (nodes: CourseOutlineNode[], nodeId: string): boolean => {
  const index = nodes.findIndex((node) => node.nodeId === nodeId);
  if (index >= 0) {
    nodes.splice(index, 1);
    return true;
  }
  return nodes.some(
    (node) => node.nodeType !== 'RESOURCE' && deleteOutlineNode(node.children, nodeId)
  );
};

const takeOutlineResource = (
  nodes: CourseOutlineNode[],
  resourceId: string,
  parentNodeId: string
): Extract<CourseOutlineNode, { nodeType: 'RESOURCE' }> | undefined => {
  const parent = findOutlineContainer(nodes, parentNodeId);
  if (!parent) return undefined;
  const index = parent.children.findIndex(
    (node) => node.nodeType === 'RESOURCE' && node.resourceId === resourceId
  );
  if (index < 0) return undefined;
  const [resource] = parent.children.splice(index, 1);
  return resource?.nodeType === 'RESOURCE' ? resource : undefined;
};

export function createCourseServicesMock(): ICourseService {
  const details = initialDetails.map(clone);
  const outlines = clone(outlineTemplates);
  const assignmentMap = clone(initialAssignments);

  replaceMockAdvancedGroups(details.map(mapCourseDetailToGroup));

  const requireDetail = (courseId: string): CourseDetail => {
    const detail = details.find((item) => item.courseId === courseId);
    if (!detail) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_NOT_FOUND, { courseId });
    }
    syncCourseBaseInfoFromGroup(detail);
    return detail;
  };

  const syncProgress = (courseId: string) => {
    const nodes = outlines[courseId];
    if (!nodes) return;
    const detail = requireDetail(courseId);
    const progress = countReadResources(nodes);
    detail.readResourceCount = progress.read;
    detail.totalResourceCount = progress.total;
  };

  return {
    async listMyCourses({ page, size }) {
      await delay();
      details.forEach(syncCourseBaseInfoFromGroup);
      const start = Math.max(0, (page - 1) * size);
      return {
        list: details.slice(start, start + size).map((item) => clone(toSummary(item))),
        total: details.length,
        page,
        size,
      };
    },

    async getCourseDetail(courseId) {
      await delay();
      syncProgress(courseId);
      return clone(requireDetail(courseId));
    },

    async getCourseHome(courseId): Promise<CourseHomeSnapshot> {
      await delay();
      syncProgress(courseId);
      const detail = requireDetail(courseId);
      const list = assignmentMap[courseId] ?? [];
      const pendingAssignments: CourseAssignmentPreview[] = list
        .filter((item) => item.status === COURSE_ASSIGNMENT_STATUS.PENDING)
        .map(clone);
      return {
        progress: {
          readResourceCount: detail.readResourceCount ?? 0,
          totalResourceCount: detail.totalResourceCount ?? 0,
          percent:
            (detail.totalResourceCount ?? 0) > 0
              ? Math.round(
                  ((detail.readResourceCount ?? 0) / (detail.totalResourceCount ?? 1)) * 100
                )
              : 0,
        },
        pendingAssignments,
        announcements: clone(announcements[courseId] ?? []),
      };
    },

    async listCourseAnnouncements(courseId) {
      await delay();
      requireDetail(courseId);
      return clone(announcements[courseId] ?? []).sort(
        (left, right) =>
          Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) ||
          new Date(right.publishTime).getTime() - new Date(left.publishTime).getTime()
      );
    },

    async getCourseOutline(courseId): Promise<CourseOutline> {
      await delay();
      requireDetail(courseId);
      return { courseId, nodes: clone(outlines[courseId] ?? []) };
    },

    async setResourceRead({ resourceId }) {
      await delay();
      let found = false;
      for (const nodes of Object.values(outlines)) {
        if (markResourceRead(nodes, resourceId)) found = true;
      }
      if (!found) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
          resourceId,
        });
      }
      for (const courseId of Object.keys(outlines)) syncProgress(courseId);
    },

    async listCourseMembers({ courseId, page, size }) {
      await delay();
      requireDetail(courseId);
      const list = courseMembers[courseId] ?? [];
      const start = Math.max(0, (page - 1) * size);
      return { members: clone(list.slice(start, start + size)), total: list.length };
    },

    async createCourse(params: CreateCourseRequest) {
      await delay();
      const courseId = `course-${Date.now()}`;
      details.unshift({
        courseId,
        name: params.name,
        description: params.description,
        term: params.term,
        category: '未设置',
        myRole: COURSE_ROLE.TEACHER,
        readResourceCount: 0,
        totalResourceCount: 0,
        pendingAssignmentCount: 0,
        teacherName: 'only317',
        teacher: { userId: 'current-user', name: 'only317' },
        learningObjectives: [],
        meetings: [],
        assessmentItems: createDefaultCourseAssessmentItems(),
        memberCount: 1,
      });
      upsertMockGroup(mapCourseDetailToGroup(details[0]));
      outlines[courseId] = [];
      assignmentMap[courseId] = [];
      return courseId;
    },

    async updateCourse(params) {
      await delay();
      const detail = requireDetail(params.courseId);
      detail.name = params.name;
      detail.description = params.description;
      detail.coverUrl = params.coverUrl;
      detail.term = params.term;
      detail.category = params.category;
      detail.startAt = params.startAt;
      detail.endAt = params.endAt;
      detail.learningObjectives = clone(params.learningObjectives);
      detail.meetings = clone(params.meetings);
      detail.meetingSchedule = params.meetings
        .map(
          (meeting) =>
            `${meeting.weekday} ${formatCoursePeriodRange(meeting.startPeriod, meeting.endPeriod)} ${getCoursePeriodTimeRange(meeting.startPeriod, meeting.endPeriod)}`
        )
        .join('；');
      detail.location = params.meetings
        .map((meeting) => meeting.location)
        .filter(Boolean)
        .join('；');
      detail.assessmentItems = clone(params.assessmentItems);
      detail.finalAssessment = params.finalAssessment ? clone(params.finalAssessment) : undefined;
      upsertMockGroup(mapCourseDetailToGroup(detail));
    },

    async getCourseOutlineEditor(courseId) {
      await delay();
      requireDetail(courseId);
      return toEditorNodes(clone(outlines[courseId] ?? []));
    },

    async createCourseOutlineSection({ courseId, parentId, name }) {
      await delay();
      requireDetail(courseId);
      const nodeId = `section-${Date.now()}`;
      const node: CourseOutlineNode = {
        nodeId,
        nodeType: parentId ? 'SECTION' : 'CHAPTER',
        title: name,
        children: [],
      };
      if (parentId) {
        const parent = findOutlineContainer(outlines[courseId] ?? [], parentId);
        if (!parent) {
          throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
            parentId,
          });
        }
        parent.children.push(node);
      } else {
        outlines[courseId] ??= [];
        outlines[courseId].push(node);
      }
      return nodeId;
    },

    async renameCourseOutlineSection({ courseId, nodeId, name }) {
      await delay();
      const node = findOutlineContainer(outlines[courseId] ?? [], nodeId);
      if (!node) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, { nodeId });
      }
      node.title = name;
    },

    async deleteCourseOutlineSection({ courseId, nodeId }) {
      await delay();
      if (!deleteOutlineNode(outlines[courseId] ?? [], nodeId)) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, { nodeId });
      }
    },

    async reorderCourseOutlineSections({ courseId, orderedNodeIds }) {
      await delay();
      const roots = outlines[courseId] ?? [];
      const nodeMap = new Map(roots.map((node) => [node.nodeId, node]));
      if (orderedNodeIds.some((nodeId) => !nodeMap.has(nodeId))) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND);
      }
      outlines[courseId] = orderedNodeIds
        .map((nodeId) => nodeMap.get(nodeId))
        .filter(Boolean) as CourseOutlineNode[];
    },

    async mountCourseOutlineResources({ courseId, targetNodeId, resources }) {
      await delay();
      const target = findOutlineContainer(outlines[courseId] ?? [], targetNodeId);
      if (!target) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
          targetNodeId,
        });
      }
      const mountedResourceIds = new Set(
        target.children
          .filter((node) => node.nodeType === 'RESOURCE')
          .map((node) => node.resourceId)
      );
      target.children.push(
        ...resources
          .filter((resource) => !mountedResourceIds.has(resource.resourceId))
          .map((resource) => ({
            nodeId: `mount-${targetNodeId}-${resource.resourceId}`,
            nodeType: 'RESOURCE' as const,
            title: resource.name,
            resourceId: resource.resourceId,
            resourceType: resource.resourceType,
            read: false,
          }))
      );
      syncProgress(courseId);
    },

    async moveCourseOutlineResource({ courseId, resourceId, sourceNodeId, targetNodeId }) {
      await delay();
      const resource = takeOutlineResource(outlines[courseId] ?? [], resourceId, sourceNodeId);
      const target = findOutlineContainer(outlines[courseId] ?? [], targetNodeId);
      if (!resource || !target) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
          resourceId,
        });
      }
      target.children.push(resource);
    },

    async removeCourseOutlineResource({ courseId, resourceId, sourceNodeId }) {
      await delay();
      const resource = takeOutlineResource(outlines[courseId] ?? [], resourceId, sourceNodeId);
      if (!resource) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
          resourceId,
        });
      }
      syncProgress(courseId);
    },

    async joinCourse({ inviteCode }) {
      await delay();
      if (!inviteCode.trim()) {
        throw createClientError(FRONTEND_CLIENT_ERROR.VALIDATION, { field: 'inviteCode' });
      }
    },

    async listCourseAssignments(courseId) {
      await delay();
      requireDetail(courseId);
      return clone(assignmentMap[courseId] ?? []);
    },

    async getCourseAssignment(courseId, assignmentId) {
      await delay();
      requireDetail(courseId);
      const assignment = assignmentMap[courseId]?.find(
        (item) => item.assignmentId === assignmentId
      );
      if (!assignment) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_ASSIGNMENT_NOT_FOUND, {
          courseId,
          assignmentId,
        });
      }
      return clone(assignment);
    },

    async submitCourseAssignment({ courseId, assignmentId, fileNames }) {
      await delay();
      const detail = requireDetail(courseId);
      const assignment = assignmentMap[courseId]?.find(
        (item) => item.assignmentId === assignmentId
      );
      if (!assignment) {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_ASSIGNMENT_NOT_FOUND, {
          courseId,
          assignmentId,
        });
      }
      if (fileNames.length === 0) {
        throw createClientError(FRONTEND_CLIENT_ERROR.VALIDATION, { field: 'fileNames' });
      }
      assignment.status = COURSE_ASSIGNMENT_STATUS.SUBMITTED;
      assignment.submittedFileNames = [...fileNames];
      assignment.submittedAt = new Date().toISOString();
      detail.pendingAssignmentCount = (assignmentMap[courseId] ?? []).filter(
        (item) => item.status === COURSE_ASSIGNMENT_STATUS.PENDING
      ).length;
    },
  };
}
