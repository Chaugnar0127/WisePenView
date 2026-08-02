import { PieChart } from '@/components/Chart';
import { Spin } from '@/components/Feedback';
import { DataTable, type DataTableColumn } from '@/components/Table';
import { useCourseService } from '@/domains';
import type { CourseMember } from '@/domains/Course';
import { formatCoursePeriodRange, getCoursePeriodTimeRange } from '@/domains/Course';
import { parseErrorMessage } from '@/utils/error';
import { Button, Chip } from '@heroui/react';
import { useRequest } from 'ahooks';
import {
  Bell,
  CalendarRange,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Clock3,
  Pin,
  Target,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCourseRouteContext } from './context';
import styles from './CourseContextPages.module.less';

export function CourseInfoPage() {
  const { t, i18n } = useTranslation('course');
  const { course } = useCourseRouteContext();
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const coursePeriod =
    course.startAt && course.endAt
      ? `${formatDate(course.startAt)} - ${formatDate(course.endAt)}`
      : t('info.notSet');
  const finalAssessment = course.finalAssessment;
  const finalAssessmentTitle = finalAssessment
    ? finalAssessment.type === 'OTHER'
      ? finalAssessment.customName || t('info.finalAssessment')
      : t(`editor.finalType.${finalAssessment.type}`)
    : t('info.notSet');
  const finalAssessmentDetail = finalAssessment
    ? finalAssessment.type === 'EXAM'
      ? [
          finalAssessment.date,
          finalAssessment.startTime && finalAssessment.endTime
            ? `${finalAssessment.startTime} - ${finalAssessment.endTime}`
            : undefined,
          finalAssessment.location,
        ]
          .filter(Boolean)
          .join(' · ')
      : finalAssessment.deadline
    : undefined;
  const assessmentTotal = course.assessmentItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.weight) ? Math.max(0, item.weight) : 0),
    0
  );

  return (
    <div className={styles.infoPage}>
      <div className={styles.infoMain}>
        <section className={styles.infoSection}>
          <header className={styles.infoSectionHeader}>
            <Target size={19} aria-hidden />
            <div>
              <h2>{t('info.goals')}</h2>
              <p>{t('info.goalsDescription')}</p>
            </div>
          </header>
          {course.learningObjectives.length > 0 ? (
            <ol className={styles.goalList}>
              {course.learningObjectives.map((objective, index) => (
                <li key={objective}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{objective}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.infoEmpty}>{t('info.notSet')}</p>
          )}
        </section>

        <section className={styles.infoSection}>
          {course.assessmentItems.length > 0 ? (
            <PieChart
              variant="section"
              icon={<ChartNoAxesColumnIncreasing size={19} aria-hidden />}
              items={course.assessmentItems.map((item, index) => ({
                id: `assessment-${index}`,
                label: item.label,
                value: item.weight,
              }))}
              targetValue={100}
              title={t('info.assessment')}
              description={t('info.assessmentDescription')}
              unallocatedLabel={t('editor.assessment.unallocated')}
              emptyLabel={t('info.notSet')}
              valueFormatter={(value) => `${value}%`}
              ariaLabel={t('editor.assessment.chartAria', { total: assessmentTotal })}
            />
          ) : (
            <div>
              <header className={styles.infoSectionHeader}>
                <div>
                  <h2>{t('info.assessment')}</h2>
                  <p>{t('info.assessmentDescription')}</p>
                </div>
              </header>
              <p className={styles.infoEmpty}>{t('info.notSet')}</p>
            </div>
          )}
        </section>
      </div>

      <aside className={styles.teachingAside}>
        <h2>{t('info.teachingDetails')}</h2>
        <div className={styles.teachingList}>
          <div className={styles.teachingItem}>
            <CalendarRange size={18} aria-hidden />
            <span>
              <small>{t('info.period')}</small>
              <strong>{coursePeriod}</strong>
              <small>{t('info.totalWeeks')}</small>
            </span>
          </div>
          <div className={styles.teachingItem}>
            <Clock3 size={18} aria-hidden />
            <span>
              <small>{t('info.schedule')}</small>
              {course.meetings.length > 0 ? (
                course.meetings.map((meeting) => (
                  <span key={meeting.meetingId} className={styles.meetingDetail}>
                    <strong>
                      {t(`editor.weekPattern.${meeting.weekPattern}`)} {meeting.weekday}{' '}
                      {formatCoursePeriodRange(meeting.startPeriod, meeting.endPeriod)}
                    </strong>
                    <small>
                      {getCoursePeriodTimeRange(meeting.startPeriod, meeting.endPeriod)}
                      {meeting.location ? ` · ${meeting.location}` : ''}
                    </small>
                  </span>
                ))
              ) : (
                <strong>{t('info.notSet')}</strong>
              )}
            </span>
          </div>
          <div className={styles.teachingItem}>
            <ClipboardList size={18} aria-hidden />
            <span>
              <small>{t('info.finalAssessment')}</small>
              <strong>
                {finalAssessmentTitle}
                {finalAssessment?.examForm ? ` · ${finalAssessment.examForm}` : ''}
              </strong>
              {finalAssessmentDetail ? <small>{finalAssessmentDetail}</small> : null}
            </span>
          </div>
          <div className={styles.teachingItem}>
            <UserRound size={18} aria-hidden />
            <span>
              <small>{t('info.teacher')}</small>
              <strong>{course.teacher.name}</strong>
              {course.teacher.department ? <small>{course.teacher.department}</small> : null}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function CourseMembersPage() {
  const { t } = useTranslation('course');
  const { course } = useCourseRouteContext();
  const courseService = useCourseService();
  const { data, loading } = useRequest(() =>
    courseService.listCourseMembers({ courseId: course.courseId, page: 1, size: 100 })
  );

  const columns: DataTableColumn<CourseMember>[] = [
    {
      id: 'member',
      label: t('members.columns.member'),
      width: 'lg',
      align: 'start',
      isRowHeader: true,
      renderCell: (member) => (
        <DataTable.MemberCell name={member.name} avatarSrc={member.avatar?.trim() || undefined} />
      ),
    },
    {
      id: 'studentNumber',
      label: t('members.columns.studentNumber'),
      width: 'md',
      align: 'start',
      renderCell: (member) => (
        <DataTable.TextCell muted>{member.studentNumber ?? '-'}</DataTable.TextCell>
      ),
    },
    {
      id: 'email',
      label: t('members.columns.email'),
      width: 'fill',
      align: 'start',
      renderCell: (member) => (
        <DataTable.TextCell title={member.email}>{member.email}</DataTable.TextCell>
      ),
    },
    {
      id: 'role',
      label: t('members.columns.role'),
      width: 'sm',
      align: 'center',
      renderCell: (member) => (
        <Chip size="sm" variant="soft">
          <Chip.Label>{t(`role.${member.role}`)}</Chip.Label>
        </Chip>
      ),
    },
  ];

  return (
    <div className={`${styles.page} ${styles.membersPage}`}>
      <header className={styles.pageHeader}>
        <h2>{t('members.title')}</h2>
        <span>{t('members.count', { count: data?.total ?? 0 })}</span>
      </header>
      <DataTable<CourseMember>
        ariaLabel={t('members.tableAria')}
        items={data?.members ?? []}
        rowKey="userId"
        columns={columns}
        loading={loading}
        emptyText={t('members.empty')}
        summary={null}
        className={styles.memberTable}
      />
    </div>
  );
}

export function CourseAnnouncementsPage() {
  const { t, i18n } = useTranslation('course');
  const { course } = useCourseRouteContext();
  const courseService = useCourseService();
  const { data, loading, error, refresh } = useRequest(() =>
    courseService.listCourseAnnouncements(course.courseId)
  );

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className={styles.state}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.state}>
        <span>{parseErrorMessage(error)}</span>
        <Button variant="secondary" onPress={refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const announcements = data ?? [];

  return (
    <div className={`${styles.page} ${styles.announcementsPage}`}>
      <header className={styles.pageHeader}>
        <h2>{t('announcements.title')}</h2>
        <span>{t('announcements.count', { count: announcements.length })}</span>
      </header>
      {announcements.length > 0 ? (
        <div className={styles.announcementFeed}>
          {announcements.map((announcement) => (
            <article key={announcement.announcementId} className={styles.announcementItem}>
              <span className={styles.announcementMarker}>
                <Bell size={18} aria-hidden />
              </span>
              <div className={styles.announcementBody}>
                <div className={styles.announcementTitleRow}>
                  <div>
                    <h3>{announcement.title}</h3>
                    {announcement.pinned ? (
                      <Chip size="sm" variant="soft">
                        <Pin size={12} aria-hidden />
                        <Chip.Label>{t('announcements.pinned')}</Chip.Label>
                      </Chip>
                    ) : null}
                  </div>
                  <time dateTime={announcement.publishTime}>
                    {formatDateTime(announcement.publishTime)}
                  </time>
                </div>
                <p>{announcement.content}</p>
                <small>
                  {t('announcements.publishedBy', { name: announcement.publisher.name })}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.state}>{t('announcements.empty')}</div>
      )}
    </div>
  );
}
