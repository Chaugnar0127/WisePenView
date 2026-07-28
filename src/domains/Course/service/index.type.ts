import type {
  CourseAssignmentDetail,
  CourseAssignmentPreview,
  CourseDetail,
  CourseHomeSnapshot,
  CourseMemberPage,
  CourseOutline,
  CourseSummary,
} from '@/domains/Course';

export interface CourseListPage {
  list: CourseSummary[];
  total: number;
  page: number;
  size: number;
}

export interface ListMyCoursesRequest {
  page: number;
  size: number;
}

export interface SetCourseResourceReadRequest {
  courseId: string;
  outlineNodeId: string;
  read: boolean;
}

export interface ListCourseMembersRequest {
  courseId: string;
  page: number;
  size: number;
}

export interface CreateCourseDraftRequest {
  name: string;
  description: string;
  term: string;
}

export interface JoinCourseRequest {
  inviteCode: string;
}

/** 第一版临时提交请求；后续由统一作业领域替换。 */
export interface SubmitCourseAssignmentRequest {
  courseId: string;
  assignmentId: string;
  fileNames: string[];
}

export interface ICourseService {
  listMyCourses(params: ListMyCoursesRequest): Promise<CourseListPage>;
  getCourseDetail(courseId: string): Promise<CourseDetail>;
  getCourseHome(courseId: string): Promise<CourseHomeSnapshot>;
  getCourseOutline(courseId: string): Promise<CourseOutline>;
  setResourceRead(params: SetCourseResourceReadRequest): Promise<void>;
  listCourseMembers(params: ListCourseMembersRequest): Promise<CourseMemberPage>;
  createCourseDraft(params: CreateCourseDraftRequest): Promise<string>;
  joinCourse(params: JoinCourseRequest): Promise<void>;
  listCourseAssignments(courseId: string): Promise<CourseAssignmentPreview[]>;
  getCourseAssignment(courseId: string, assignmentId: string): Promise<CourseAssignmentDetail>;
  submitCourseAssignment(params: SubmitCourseAssignmentRequest): Promise<void>;
}
