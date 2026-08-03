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

export const COURSE_WEEK_PATTERN = {
  EVERY: 'EVERY',
  ODD: 'ODD',
  EVEN: 'EVEN',
} as const;

export type CourseWeekPattern = (typeof COURSE_WEEK_PATTERN)[keyof typeof COURSE_WEEK_PATTERN];

export const COURSE_FINAL_ASSESSMENT_TYPE = {
  EXAM: 'EXAM',
  PAPER: 'PAPER',
  OTHER: 'OTHER',
} as const;

export type CourseFinalAssessmentType =
  (typeof COURSE_FINAL_ASSESSMENT_TYPE)[keyof typeof COURSE_FINAL_ASSESSMENT_TYPE];

export const isCourseWeekPattern = (value: unknown): value is CourseWeekPattern =>
  Object.values(COURSE_WEEK_PATTERN).some((item) => item === value);

export const isCourseFinalAssessmentType = (value: unknown): value is CourseFinalAssessmentType =>
  Object.values(COURSE_FINAL_ASSESSMENT_TYPE).some((item) => item === value);
