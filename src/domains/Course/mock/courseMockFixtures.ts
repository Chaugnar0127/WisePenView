import { createDefaultCourseAssessmentItems } from '../constants/defaults';
import type {
  CourseAnnouncement,
  CourseAssignmentDetail,
  CourseDetail,
  CourseMember,
  CourseOutlineNode,
} from '../entity/course';
import { COURSE_ASSIGNMENT_STATUS, COURSE_ROLE } from '../enum';

export const PRIMARY_COURSE_ID = 'course-data-structures';

export const COURSE_MOCK_TEACHER = {
  userId: 'mock-teacher-primary',
  name: '示例教师',
  department: '示例学院',
};

export const COURSE_MOCK_DETAILS: CourseDetail[] = [
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
    teacherName: COURSE_MOCK_TEACHER.name,
    teacher: COURSE_MOCK_TEACHER,
    startAt: '2026-03-02T00:00:00+08:00',
    endAt: '2026-07-03T23:59:59+08:00',
    meetingSchedule: '周二 3、4节 09:55–11:35',
    location: '示例楼 A203',
    meetings: [
      {
        meetingId: 'meeting-tuesday',
        weekPattern: 'EVERY',
        weekday: '周二',
        startPeriod: 3,
        endPeriod: 4,
        location: '示例楼 A203',
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
      location: '示例楼 201',
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
    teacherName: '示例教师甲',
    teacher: {
      userId: 'mock-teacher-network',
      name: '示例教师甲',
      department: '示例学院',
    },
    startAt: '2026-03-02T00:00:00+08:00',
    endAt: '2026-07-03T23:59:59+08:00',
    meetingSchedule: '周一 6、7节 13:30–15:10',
    location: '示例楼 B305',
    meetings: [
      {
        meetingId: 'meeting-monday',
        weekPattern: 'EVERY',
        weekday: '周一',
        startPeriod: 6,
        endPeriod: 7,
        location: '示例楼 B305',
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
    teacherName: '当前教师',
    teacher: { userId: 'mock-current-user', name: '当前教师', department: '示例学院' },
    startAt: '2025-09-01T00:00:00+08:00',
    endAt: '2026-01-09T23:59:59+08:00',
    meetingSchedule: '周五 6、7、8节 13:30–16:10',
    location: '示例楼 C401',
    meetings: [
      {
        meetingId: 'meeting-friday',
        weekPattern: 'EVERY',
        weekday: '周五',
        startPeriod: 6,
        endPeriod: 8,
        location: '示例楼 C401',
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

export const COURSE_MOCK_OUTLINES: Record<string, CourseOutlineNode[]> = {
  'course-computer-networks': [
    {
      nodeId: 'network-chapter-1',
      nodeType: 'CHAPTER',
      title: '第一章 计算机网络概述',
      description: '了解计算机网络的基本组成、分层思想以及本课程的学习要求。',
      children: [
        {
          nodeId: 'network-introduction',
          nodeType: 'RESOURCE',
          title: '课程导学与学习要求',
          resourceId: 'mock-note-1',
          resourceType: 'note',
          durationLabel: '10 分钟',
          read: true,
        },
      ],
    },
    {
      nodeId: 'network-chapter-2',
      nodeType: 'CHAPTER',
      title: '第二章 应用层',
      children: [
        {
          nodeId: 'network-http',
          nodeType: 'SECTION',
          title: '2.1 HTTP 与 Web',
          children: [
            {
              nodeId: 'network-http-reading',
              nodeType: 'RESOURCE',
              title: 'HTTP 协议补充阅读',
              resourceId: 'mock-course-syllabus',
              resourceType: 'file',
              viewer: 'pdf-preview',
              read: false,
            },
          ],
        },
      ],
    },
  ],
  [PRIMARY_COURSE_ID]: [
    {
      nodeId: 'chapter-1',
      nodeType: 'CHAPTER',
      title: '第一章 课程概览',
      description: '从课程导学开始，了解本学期的学习安排、考核方式与资源使用方法。',
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
          description: '学习线性表的逻辑结构，并比较顺序存储与链式存储的实现特点。',
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

export const COURSE_MOCK_ASSIGNMENTS: Record<string, CourseAssignmentDetail[]> = {
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

export const COURSE_MOCK_ANNOUNCEMENTS: Record<string, CourseAnnouncement[]> = {
  [PRIMARY_COURSE_ID]: [
    {
      announcementId: 'announcement-2',
      title: '第二章学习安排',
      content: '请在周四课程前完成线性表相关内容，并按时提交链表操作作业。',
      publisher: COURSE_MOCK_TEACHER,
      publishTime: '2026-07-24T09:00:00+08:00',
      pinned: true,
    },
    {
      announcementId: 'announcement-materials',
      title: '课程资料已更新',
      content: '课程组资料中已上传第 1-2 周课堂课件。',
      publisher: COURSE_MOCK_TEACHER,
      publishTime: '2026-07-20T15:30:00+08:00',
    },
  ],
};

export const COURSE_MOCK_MEMBERS: Record<string, CourseMember[]> = {
  [PRIMARY_COURSE_ID]: [
    {
      userId: COURSE_MOCK_TEACHER.userId,
      name: COURSE_MOCK_TEACHER.name,
      email: 'teacher@example.invalid',
      role: COURSE_ROLE.TEACHER,
    },
    {
      userId: 'mock-assistant',
      name: '示例助教',
      email: 'assistant@example.invalid',
      studentNumber: '2026000001',
      role: COURSE_ROLE.ASSISTANT,
    },
    {
      userId: 'mock-student-current',
      name: '当前学生',
      email: 'student@example.invalid',
      studentNumber: '2026000002',
      role: COURSE_ROLE.STUDENT,
    },
  ],
  'course-computer-networks': [
    {
      userId: 'mock-teacher-network',
      name: '示例教师甲',
      email: 'network-teacher@example.invalid',
      role: COURSE_ROLE.TEACHER,
    },
    {
      userId: 'mock-student-network-current',
      name: '当前学生',
      email: 'network-student@example.invalid',
      studentNumber: '2026000011',
      role: COURSE_ROLE.STUDENT,
    },
    {
      userId: 'mock-student-network-peer',
      name: '示例同学',
      email: 'network-peer@example.invalid',
      studentNumber: '2026000012',
      role: COURSE_ROLE.STUDENT,
    },
  ],
};
