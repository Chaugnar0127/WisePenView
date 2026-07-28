import type { ICourseService } from '@/domains/Course';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';

const unavailable = async (): Promise<never> => {
  throw createClientError(FRONTEND_CLIENT_ERROR.COURSE_SERVICE_UNAVAILABLE);
};

/** Course 后端尚未接入；真实模式明确报错，完整页面交互请使用 mock 模式。 */
export const createCourseServices = (): ICourseService => ({
  listMyCourses: unavailable,
  getCourseDetail: unavailable,
  getCourseHome: unavailable,
  getCourseOutline: unavailable,
  setResourceRead: unavailable,
  listCourseMembers: unavailable,
  createCourseDraft: unavailable,
  joinCourse: unavailable,
  listCourseAssignments: unavailable,
  getCourseAssignment: unavailable,
  submitCourseAssignment: unavailable,
});
