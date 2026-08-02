import AppAvatar from '@/components/Avatar';
import { Spin } from '@/components/Feedback';
import { useCourseService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { Button, Meter, ProgressBar } from '@heroui/react';
import { useRequest } from 'ahooks';
import { ArrowRight, Bell, BookOpen, CalendarClock, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCourseRouteContext } from './context';
import styles from './CourseHomePage.module.less';

function CourseHomePage() {
  const { t, i18n } = useTranslation('course');
  const { course } = useCourseRouteContext();
  const courseService = useCourseService();
  const navigate = useNavigate();
  const basePath = `/app/course/${course.courseId}`;
  const { data, loading, error, refresh } = useRequest(() =>
    courseService.getCourseHome(course.courseId)
  );

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(i18n.language, {
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

  if (error || !data) {
    return (
      <div className={styles.state}>
        <span>{error ? parseErrorMessage(error) : t('common.notFound')}</span>
        <Button variant="secondary" onPress={refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.homeLayout}>
      <div className={styles.leftScroll}>
        <section className={styles.homeSection}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionIcon}>
              <BookOpen size={18} aria-hidden />
            </span>
            <div>
              <h2>{t('home.learning')}</h2>
              <p>
                {t('home.readProgress', {
                  read: data.progress.readResourceCount,
                  total: data.progress.totalResourceCount,
                })}
              </p>
            </div>
          </div>
          <Button variant="primary" onPress={() => navigate(`${basePath}/learning`)}>
            {t('home.enterLearning')}
            <ArrowRight size={16} aria-hidden />
          </Button>
        </section>

        <section className={styles.homeSection}>
          <div className={styles.sectionTitleRow}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIcon}>
                <ClipboardCheck size={18} aria-hidden />
              </span>
              <h2>{t('home.pendingAssignments')}</h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => navigate(`${basePath}/assignments`)}
            >
              {t('home.viewAll')}
            </Button>
          </div>
          {data.pendingAssignments.length > 0 ? (
            <div className={styles.assignmentList}>
              {data.pendingAssignments.map((assignment) => (
                <button
                  key={assignment.assignmentId}
                  type="button"
                  className={styles.assignmentRow}
                  onClick={() => navigate(`${basePath}/assignments/${assignment.assignmentId}`)}
                >
                  <span>
                    <strong>{assignment.title}</strong>
                    {assignment.scopeLabel ? <small>{assignment.scopeLabel}</small> : null}
                  </span>
                  <span className={styles.deadline}>
                    <CalendarClock size={15} aria-hidden />
                    {formatDateTime(assignment.deadline)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.emptyCopy}>{t('home.noAssignments')}</p>
          )}
        </section>

        <section className={styles.homeSection}>
          <div className={styles.sectionTitleRow}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIcon}>
                <Bell size={18} aria-hidden />
              </span>
              <h2>{t('home.announcements')}</h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => navigate(`${basePath}/announcements`)}
            >
              {t('home.viewAll')}
            </Button>
          </div>
          {data.announcements.length > 0 ? (
            <div className={styles.announcementList}>
              {data.announcements.map((announcement) => (
                <article key={announcement.announcementId} className={styles.announcement}>
                  <div>
                    <h3>{announcement.title}</h3>
                    <time>{formatDateTime(announcement.publishTime)}</time>
                  </div>
                  <p>{announcement.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyCopy}>{t('home.noAnnouncements')}</p>
          )}
        </section>
      </div>

      <aside className={styles.progressAside}>
        <div className={styles.progressMetrics}>
          <h2>{t('home.courseProgress')}</h2>
          <div className={styles.metric}>
            <Meter
              aria-label={t('home.courseProgress')}
              value={data.progress.percent}
              valueLabel={`${data.progress.percent}%`}
              className={styles.progressMeter}
            >
              <Meter.Output className={styles.metricValue} />
            </Meter>
            <ProgressBar
              aria-label={t('home.courseProgress')}
              value={data.progress.percent}
              className={styles.progressBar}
            >
              <ProgressBar.Track className={styles.progressTrack}>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>{t('home.completedContent')}</span>
            <div className={styles.metricValue}>
              {data.progress.readResourceCount} <small>/ {data.progress.totalResourceCount}</small>
            </div>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>{t('home.pendingAssignments')}</span>
            <div className={styles.metricValue}>{data.pendingAssignments.length}</div>
          </div>
        </div>
        <div className={styles.teacherSummary}>
          <AppAvatar size="sm" className={styles.teacherAvatar}>
            {course.teacher.avatar ? (
              <AppAvatar.Image src={course.teacher.avatar} alt={course.teacher.name} />
            ) : null}
            <AppAvatar.Fallback>{course.teacher.name.charAt(0)}</AppAvatar.Fallback>
          </AppAvatar>
          <div>
            <strong>{course.teacher.name}</strong>
            {course.teacher.department ? <small>{course.teacher.department}</small> : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default CourseHomePage;
