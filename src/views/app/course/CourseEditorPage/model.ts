import {
  COURSE_FINAL_ASSESSMENT_TYPE,
  COURSE_WEEK_PATTERN,
  createDefaultCourseAssessmentItems,
  type CourseAssessmentItem,
  type CourseDetail,
  type CourseFinalAssessment,
  type CourseMeeting,
  type CourseWeekPattern,
} from '@/domains/Course';

export interface CourseAssessmentEditorItem extends CourseAssessmentItem {
  editorId: string;
}

export interface CourseEditorForm {
  name: string;
  description: string;
  coverUrl: string;
  term: string;
  category: string;
  startAt: string;
  endAt: string;
  learningObjectives: string;
  meetings: CourseMeeting[];
  assessmentItems: CourseAssessmentEditorItem[];
  finalAssessment: CourseFinalAssessment;
  finalAssessmentDeadlineTime: string;
}

export type UpdateCourseEditorForm = <K extends keyof CourseEditorForm>(
  key: K,
  value: CourseEditorForm[K]
) => void;

export const COURSE_WEEK_PATTERNS: CourseWeekPattern[] = Object.values(COURSE_WEEK_PATTERN);
export const COURSE_WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const COURSE_ASSESSMENT_TYPES: CourseFinalAssessment['type'][] = Object.values(
  COURSE_FINAL_ASSESSMENT_TYPE
);
export const COURSE_EDITOR_SECTION_IDS = [
  'course-editor-basic',
  'course-editor-goals',
  'course-editor-schedule',
  'course-editor-assessment',
  'course-editor-outline',
  'course-editor-access',
] as const;
export type CourseEditorSectionId = (typeof COURSE_EDITOR_SECTION_IDS)[number];

export const createCourseMeeting = (): CourseMeeting => ({
  meetingId: crypto.randomUUID(),
  weekPattern: COURSE_WEEK_PATTERN.EVERY,
  weekday: '周一',
  startPeriod: 1,
  endPeriod: 2,
  location: '',
});

export const createAssessmentEditorItem = (
  item: CourseAssessmentItem
): CourseAssessmentEditorItem => ({
  ...item,
  editorId: crypto.randomUUID(),
});

export const createCourseEditorForm = (course: CourseDetail): CourseEditorForm => ({
  name: course.name,
  description: course.description,
  coverUrl: course.coverUrl ?? '',
  term: course.term,
  category: course.category ?? '',
  startAt: course.startAt?.slice(0, 10) ?? '',
  endAt: course.endAt?.slice(0, 10) ?? '',
  learningObjectives: course.learningObjectives.join('\n'),
  meetings: course.meetings.length > 0 ? course.meetings : [createCourseMeeting()],
  assessmentItems:
    course.assessmentItems.length > 0
      ? course.assessmentItems.map(createAssessmentEditorItem)
      : createDefaultCourseAssessmentItems().map(createAssessmentEditorItem),
  finalAssessment: course.finalAssessment ?? { type: COURSE_FINAL_ASSESSMENT_TYPE.EXAM },
  finalAssessmentDeadlineTime: course.finalAssessment?.deadline?.split('T')[1] ?? '23:59',
});

export const getCourseAssessmentTotal = (items: CourseAssessmentEditorItem[]) =>
  items.reduce(
    (sum, item) => sum + (Number.isFinite(item.weight) ? Math.max(0, item.weight) : 0),
    0
  );
