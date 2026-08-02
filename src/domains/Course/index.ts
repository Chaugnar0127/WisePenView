export { createDefaultCourseAssessmentItems } from './defaults';
export type * from './entity/course';
export {
  COURSE_ASSIGNMENT_STATUS,
  COURSE_ROLE,
  type CourseAssignmentStatus,
  type CourseRole,
} from './enum';
export {
  FUDAN_COURSE_PERIODS,
  formatCoursePeriodRange,
  getCoursePeriodTimeRange,
  isCoursePeriod,
} from './schedule';
export type * from './service/index.type';
