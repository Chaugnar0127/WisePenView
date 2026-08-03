import type { CourseAssessmentItem } from '@/domains/Course/entity/course';

export const createDefaultCourseAssessmentItems = (): CourseAssessmentItem[] => [
  { label: '平时分', weight: 10 },
  { label: '作业', weight: 20 },
  { label: '期末考试', weight: 70 },
];
