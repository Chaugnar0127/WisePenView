export const COURSE_ROLE = {
  STUDENT: 'STUDENT',
  ASSISTANT: 'ASSISTANT',
  TEACHER: 'TEACHER',
} as const;

export type CourseRole = (typeof COURSE_ROLE)[keyof typeof COURSE_ROLE];

export const COURSE_ASSIGNMENT_STATUS = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  GRADED: 'GRADED',
} as const;

export type CourseAssignmentStatus =
  (typeof COURSE_ASSIGNMENT_STATUS)[keyof typeof COURSE_ASSIGNMENT_STATUS];
