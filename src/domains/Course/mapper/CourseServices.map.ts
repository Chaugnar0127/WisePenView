import type {
  CourseAssessmentItem,
  CourseDetail,
  CourseFinalAssessment,
  CourseMeeting,
  CourseMember,
  CourseRole,
  CourseSummary,
} from '@/domains/Course';
import { COURSE_ROLE } from '@/domains/Course';
import {
  formatCoursePeriodRange,
  getCoursePeriodTimeRange,
  isCoursePeriod,
} from '@/domains/Course/schedule';
import type { Group, GroupMember } from '@/domains/Group';

const COURSE_META_SCHEMA = 'wisepen.course.v1';
const COURSE_META_KEYS = new Set([
  'schema',
  'term',
  'category',
  'startAt',
  'endAt',
  'outlineRootTagId',
  'learningObjectives',
  'meetings',
  'assessmentItems',
  'finalAssessment',
]);

interface CourseMetaV1 {
  schema: typeof COURSE_META_SCHEMA;
  term: string;
  category?: string;
  startAt?: string;
  endAt?: string;
  outlineRootTagId?: string;
  learningObjectives?: string[];
  meetings?: CourseMeeting[];
  assessmentItems?: CourseAssessmentItem[];
  finalAssessment?: CourseFinalAssessment;
}

interface SerializeCourseMetaRequest {
  term: string;
  category?: string;
  startAt?: string;
  endAt?: string;
  outlineRootTagId?: string;
  learningObjectives?: string[];
  meetings?: CourseMeeting[];
  assessmentItems?: CourseAssessmentItem[];
  finalAssessment?: CourseFinalAssessment;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const parseFinalAssessment = (value: unknown): CourseFinalAssessment | undefined => {
  if (!isRecord(value)) return undefined;
  if (value.type !== 'EXAM' && value.type !== 'PAPER' && value.type !== 'OTHER') {
    return undefined;
  }
  return {
    type: value.type,
    customName: parseOptionalString(value.customName),
    examForm: parseOptionalString(value.examForm),
    date: parseOptionalString(value.date),
    startTime: parseOptionalString(value.startTime),
    endTime: parseOptionalString(value.endTime),
    location: parseOptionalString(value.location),
    deadline: parseOptionalString(value.deadline),
  };
};

const calculateTeachingWeek = (startAt?: string): number | undefined => {
  if (!startAt) return undefined;
  const startDate = new Date(`${startAt.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) return undefined;
  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / 86_400_000);
  if (elapsedDays < 0) return undefined;
  return Math.min(18, Math.floor(elapsedDays / 7) + 1);
};

const parseCourseMeta = (groupMetaInfo: Record<string, unknown>): CourseMetaV1 => {
  const raw = groupMetaInfo.course;
  if (!isRecord(raw) || raw.schema !== COURSE_META_SCHEMA) {
    return { schema: COURSE_META_SCHEMA, term: '' };
  }
  return {
    schema: COURSE_META_SCHEMA,
    term: typeof raw.term === 'string' ? raw.term : '',
    category: typeof raw.category === 'string' ? raw.category : undefined,
    startAt: typeof raw.startAt === 'string' ? raw.startAt : undefined,
    endAt: typeof raw.endAt === 'string' ? raw.endAt : undefined,
    outlineRootTagId: typeof raw.outlineRootTagId === 'string' ? raw.outlineRootTagId : undefined,
    learningObjectives: Array.isArray(raw.learningObjectives)
      ? raw.learningObjectives.filter((item): item is string => typeof item === 'string')
      : undefined,
    meetings: Array.isArray(raw.meetings)
      ? raw.meetings.filter(
          (item): item is CourseMeeting =>
            isRecord(item) &&
            typeof item.meetingId === 'string' &&
            (item.weekPattern === 'EVERY' ||
              item.weekPattern === 'ODD' ||
              item.weekPattern === 'EVEN') &&
            typeof item.weekday === 'string' &&
            isCoursePeriod(item.startPeriod) &&
            isCoursePeriod(item.endPeriod) &&
            item.startPeriod <= item.endPeriod &&
            typeof item.location === 'string'
        )
      : undefined,
    assessmentItems: Array.isArray(raw.assessmentItems)
      ? raw.assessmentItems.filter(
          (item): item is CourseAssessmentItem =>
            isRecord(item) && typeof item.label === 'string' && typeof item.weight === 'number'
        )
      : undefined,
    finalAssessment: parseFinalAssessment(raw.finalAssessment),
  };
};

const serializeCourseMeta = (
  params: SerializeCourseMetaRequest,
  groupMetaInfo: Record<string, unknown> = {}
): Record<string, unknown> => {
  const currentCourseMeta = isRecord(groupMetaInfo.course) ? groupMetaInfo.course : {};
  const unknownCourseMeta = Object.fromEntries(
    Object.entries(currentCourseMeta).filter(([key]) => !COURSE_META_KEYS.has(key))
  );
  return {
    ...groupMetaInfo,
    course: {
      ...unknownCourseMeta,
      schema: COURSE_META_SCHEMA,
      term: params.term,
      ...(params.category ? { category: params.category } : {}),
      ...(params.startAt ? { startAt: params.startAt } : {}),
      ...(params.endAt ? { endAt: params.endAt } : {}),
      ...(params.outlineRootTagId ? { outlineRootTagId: params.outlineRootTagId } : {}),
      ...(params.learningObjectives ? { learningObjectives: params.learningObjectives } : {}),
      ...(params.meetings ? { meetings: params.meetings } : {}),
      ...(params.assessmentItems ? { assessmentItems: params.assessmentItems } : {}),
      ...(params.finalAssessment ? { finalAssessment: params.finalAssessment } : {}),
    } satisfies CourseMetaV1,
  };
};

const mapGroupRole = (role: 'OWNER' | 'ADMIN' | 'MEMBER'): CourseRole => {
  if (role === 'OWNER') return COURSE_ROLE.TEACHER;
  if (role === 'ADMIN') return COURSE_ROLE.ASSISTANT;
  return COURSE_ROLE.STUDENT;
};

const mapGroupMemberToCourseMember = (member: GroupMember): CourseMember => ({
  userId: member.userId,
  name: member.realname || member.nickname,
  avatar: member.avatar || undefined,
  email: member.email ?? '',
  studentNumber: member.campusNo,
  role: mapGroupRole(member.role),
});

const getTeacherName = (group: Group): string =>
  group.ownerInfo?.realName || group.ownerInfo?.nickname || '';

const mapGroupToCourseSummary = (
  group: Group,
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
): CourseSummary => {
  const metadata = parseCourseMeta(group.groupMetaInfo);
  return {
    courseId: group.groupId,
    name: group.groupName,
    description: group.groupDesc,
    coverUrl: group.groupCoverUrl || undefined,
    term: metadata.term,
    category: metadata.category,
    myRole: mapGroupRole(role),
    teacherName: getTeacherName(group),
  };
};

const mapGroupToCourseDetail = (group: Group, role: 'OWNER' | 'ADMIN' | 'MEMBER'): CourseDetail => {
  const metadata = parseCourseMeta(group.groupMetaInfo);
  const teacherName = getTeacherName(group);
  return {
    ...mapGroupToCourseSummary(group, role),
    teacher: {
      userId: group.ownerId ?? '',
      name: teacherName,
      avatar: group.ownerInfo?.avatar,
    },
    startAt: metadata.startAt,
    endAt: metadata.endAt,
    meetingSchedule: metadata.meetings
      ?.map(
        (meeting) =>
          `${meeting.weekday} ${formatCoursePeriodRange(meeting.startPeriod, meeting.endPeriod)} ${getCoursePeriodTimeRange(meeting.startPeriod, meeting.endPeriod)}`
      )
      .join('；'),
    location: metadata.meetings
      ?.map((meeting) => meeting.location)
      .filter(Boolean)
      .join('；'),
    learningObjectives: metadata.learningObjectives ?? [],
    assessmentItems: metadata.assessmentItems ?? [],
    meetings: metadata.meetings ?? [],
    finalAssessment: metadata.finalAssessment,
    outlineRootTagId: metadata.outlineRootTagId,
    teachingWeek: calculateTeachingWeek(metadata.startAt),
    memberCount: group.memberCount,
  };
};

export const CourseServicesMap = {
  parseCourseMeta,
  serializeCourseMeta,
  mapGroupToCourseSummary,
  mapGroupToCourseDetail,
  mapGroupMemberToCourseMember,
};
