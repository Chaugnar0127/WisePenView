import type { CourseAssignmentStatus, CourseRole, CourseStatus } from '@/domains/Course/enum';

export interface CourseCapabilities {
  canEditCourse: boolean;
  canEditOutline: boolean;
  canManageMaterials: boolean;
  canManageMembers: boolean;
  canPublishAnnouncement: boolean;
  canPublishCourse: boolean;
}

export interface CourseTeacher {
  userId: string;
  name: string;
  avatar?: string;
  department?: string;
}

export interface CourseSummary {
  courseId: string;
  name: string;
  description: string;
  coverUrl?: string;
  term: string;
  category?: string;
  status: CourseStatus;
  myRole: CourseRole;
  capabilities: CourseCapabilities;
  readResourceCount: number;
  totalResourceCount: number;
  pendingAssignmentCount: number;
  teacherName: string;
}

export interface CourseDetail extends CourseSummary {
  courseGroupId: string;
  teacher: CourseTeacher;
  teachingWeek?: number;
  memberCount: number;
}

export interface CourseProgress {
  readResourceCount: number;
  totalResourceCount: number;
  percent: number;
}

export interface CourseAnnouncement {
  announcementId: string;
  title: string;
  content: string;
  publisher: CourseTeacher;
  publishTime: string;
}

export interface CourseAssignmentPreview {
  assignmentId: string;
  title: string;
  scopeLabel?: string;
  deadline: string;
  status: CourseAssignmentStatus;
}

/** 第一版课程页使用的临时详情模型，不表达作业与大纲的长期关系。 */
export interface CourseAssignmentDetail extends CourseAssignmentPreview {
  description: string;
  score?: number;
  submittedFileNames: string[];
  submittedAt?: string;
}

export interface CourseHomeSnapshot {
  progress: CourseProgress;
  pendingAssignments: CourseAssignmentPreview[];
  announcements: CourseAnnouncement[];
}

interface CourseOutlineNodeBase {
  nodeId: string;
  title: string;
}

export interface CourseOutlineContainerNode extends CourseOutlineNodeBase {
  nodeType: 'CHAPTER' | 'SECTION';
  children: CourseOutlineNode[];
}

export interface CourseOutlineResourceNode extends CourseOutlineNodeBase {
  nodeType: 'RESOURCE';
  resourceId: string;
  resourceType: string;
  viewer?: string;
  durationLabel?: string;
  read: boolean;
}

export type CourseOutlineNode = CourseOutlineContainerNode | CourseOutlineResourceNode;

export interface CourseOutline {
  courseId: string;
  nodes: CourseOutlineNode[];
}

export interface CourseMember {
  userId: string;
  name: string;
  avatar?: string;
  email: string;
  studentNumber?: string;
  role: CourseRole;
}

export interface CourseMemberPage {
  members: CourseMember[];
  total: number;
}
