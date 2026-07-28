import type {
  CourseAnnouncement,
  CourseAssignmentDetail,
  CourseAssignmentPreview,
  CourseCapabilities,
  CourseDetail,
  CourseHomeSnapshot,
  CourseMember,
  CourseOutline,
  CourseOutlineNode,
  CourseSummary,
  CreateCourseDraftRequest,
  ICourseService,
} from '@/domains/Course';
import { COURSE_ASSIGNMENT_STATUS, COURSE_ROLE, COURSE_STATUS } from '@/domains/Course';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';

const NETWORK_DELAY_MS = 180;
const PRIMARY_COURSE_ID = 'course-data-structures';

const delay = async () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, NETWORK_DELAY_MS));
const clone = <T>(value: T): T => structuredClone(value);

const STUDENT_CAPABILITIES: CourseCapabilities = {
  canEditCourse: false,
  canEditOutline: false,
  canManageMaterials: false,
  canManageMembers: false,
  canPublishAnnouncement: false,
  canPublishCourse: false,
};

const TEACHER_CAPABILITIES: CourseCapabilities = {
  canEditCourse: true,
  canEditOutline: true,
  canManageMaterials: true,
  canManageMembers: true,
  canPublishAnnouncement: true,
  canPublishCourse: true,
};

const teacher = {
  userId: 'teacher-chen',
  name: '陈明远',
  department: '计算机学院',
};

const initialDetails: CourseDetail[] = [
  {
    courseId: PRIMARY_COURSE_ID,
    courseGroupId: 'course-group-data-structures',
    name: '数据结构与算法',
    description: '从抽象数据类型到经典算法，理解数据组织、问题建模与程序效率之间的关系。',
    term: '2026 春季',
    category: '必修课',
    status: COURSE_STATUS.PUBLISHED,
    myRole: COURSE_ROLE.STUDENT,
    capabilities: STUDENT_CAPABILITIES,
    readResourceCount: 4,
    totalResourceCount: 9,
    pendingAssignmentCount: 2,
    teacherName: teacher.name,
    teacher,
    teachingWeek: 8,
    memberCount: 86,
  },
  {
    courseId: 'course-computer-networks',
    courseGroupId: 'course-group-computer-networks',
    name: '计算机网络',
    description: '理解分层网络体系、核心协议与现代互联网基础设施。',
    term: '2026 春季',
    category: '必修课',
    status: COURSE_STATUS.PUBLISHED,
    myRole: COURSE_ROLE.STUDENT,
    capabilities: STUDENT_CAPABILITIES,
    readResourceCount: 17,
    totalResourceCount: 25,
    pendingAssignmentCount: 1,
    teacherName: '周静',
    teacher: { userId: 'teacher-zhou', name: '周静', department: '计算机学院' },
    teachingWeek: 8,
    memberCount: 72,
  },
  {
    courseId: 'course-database-systems',
    courseGroupId: 'course-group-database-systems',
    name: '数据库系统',
    description: '数据库系统原理、关系模型、查询处理与事务管理。',
    term: '2025 秋季',
    category: '专业选修',
    status: COURSE_STATUS.ARCHIVED,
    myRole: COURSE_ROLE.TEACHER,
    capabilities: TEACHER_CAPABILITIES,
    readResourceCount: 24,
    totalResourceCount: 24,
    pendingAssignmentCount: 0,
    teacherName: 'only317',
    teacher: { userId: 'current-user', name: 'only317', department: '计算机学院' },
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
    },
    {
      announcementId: 'announcement-materials',
      title: '课程资料已更新',
      content: '课程组资料中已上传第 1-2 周课堂课件。',
      publisher: teacher,
      publishTime: '2026-07-20T15:30:00+08:00',
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
    courseGroupId: _courseGroupId,
    teacher: _teacher,
    teachingWeek: _teachingWeek,
    memberCount: _memberCount,
    ...summary
  } = detail;
  return summary;
};

function findOutlineNode(
  nodes: CourseOutlineNode[],
  nodeId: string
): CourseOutlineNode | undefined {
  for (const node of nodes) {
    if (node.nodeId === nodeId) return node;
    if (node.nodeType !== 'RESOURCE') {
      const found = findOutlineNode(node.children, nodeId);
      if (found) return found;
    }
  }
  return undefined;
}

function countReadResources(nodes: CourseOutlineNode[]): { read: number; total: number } {
  let read = 0;
  let total = 0;
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') {
      total += 1;
      if (node.read) read += 1;
    } else {
      const childCount = countReadResources(node.children);
      read += childCount.read;
      total += childCount.total;
    }
  }
  return { read, total };
}

export function createCourseServicesMock(): ICourseService {
  const details = initialDetails.map(clone);
  const outlines = clone(outlineTemplates);
  const assignmentMap = clone(initialAssignments);

  const requireDetail = (courseId: string): CourseDetail => {
    const detail = details.find((item) => item.courseId === courseId);
    if (!detail) {
      throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_NOT_FOUND, { courseId });
    }
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
          readResourceCount: detail.readResourceCount,
          totalResourceCount: detail.totalResourceCount,
          percent:
            detail.totalResourceCount > 0
              ? Math.round((detail.readResourceCount / detail.totalResourceCount) * 100)
              : 0,
        },
        pendingAssignments,
        announcements: clone(announcements[courseId] ?? []),
      };
    },

    async getCourseOutline(courseId): Promise<CourseOutline> {
      await delay();
      requireDetail(courseId);
      return { courseId, nodes: clone(outlines[courseId] ?? []) };
    },

    async setResourceRead({ courseId, outlineNodeId, read }) {
      await delay();
      const nodes = outlines[courseId] ?? [];
      const node = findOutlineNode(nodes, outlineNodeId);
      if (!node || node.nodeType !== 'RESOURCE') {
        throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_OUTLINE_NODE_NOT_FOUND, {
          courseId,
          outlineNodeId,
        });
      }
      node.read = read;
      syncProgress(courseId);
    },

    async listCourseMembers({ courseId, page, size }) {
      await delay();
      requireDetail(courseId);
      const list = courseMembers[courseId] ?? [];
      const start = Math.max(0, (page - 1) * size);
      return { members: clone(list.slice(start, start + size)), total: list.length };
    },

    async createCourseDraft(params: CreateCourseDraftRequest) {
      await delay();
      const courseId = `course-draft-${Date.now()}`;
      details.unshift({
        courseId,
        courseGroupId: `course-group-${courseId}`,
        name: params.name,
        description: params.description,
        term: params.term,
        category: '未设置',
        status: COURSE_STATUS.DRAFT,
        myRole: COURSE_ROLE.TEACHER,
        capabilities: TEACHER_CAPABILITIES,
        readResourceCount: 0,
        totalResourceCount: 0,
        pendingAssignmentCount: 0,
        teacherName: 'only317',
        teacher: { userId: 'current-user', name: 'only317' },
        memberCount: 1,
      });
      outlines[courseId] = [];
      assignmentMap[courseId] = [];
      return courseId;
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
