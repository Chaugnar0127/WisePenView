import SegmentedTabs from '@/components/SegmentedTabs';
import { useCourseRouteContext } from '@/views/app/course/context';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from './CourseLayout.module.less';
import CourseNavigationSidebar from './CourseNavigationSidebar';

const CONTEXT_PAGE_KEYS = ['home', 'info', 'members', 'discussion'] as const;
type ContextPageKey = (typeof CONTEXT_PAGE_KEYS)[number];

function resolveContextPage(pathname: string): ContextPageKey {
  const segment = pathname.split('/').at(-1);
  return CONTEXT_PAGE_KEYS.includes(segment as ContextPageKey)
    ? (segment as ContextPageKey)
    : 'home';
}

function CourseLayout() {
  const { t } = useTranslation('course');
  const context = useCourseRouteContext();
  const { course } = context;
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = `/app/course/${course.courseId}`;
  const contextPage = resolveContextPage(location.pathname);
  const showCourseHeader = CONTEXT_PAGE_KEYS.some((key) => location.pathname.endsWith(`/${key}`));

  return (
    <div className={styles.root}>
      <CourseNavigationSidebar />

      <main className={styles.main}>
        {showCourseHeader ? (
          <>
            <header className={styles.courseHeader}>
              <div className={styles.courseKicker}>
                {course.term} · {course.category}
              </div>
              <h1>{course.name}</h1>
              <p>{course.description}</p>
              <div className={styles.courseMeta}>
                <span>{course.teacher.name}</span>
                {course.teachingWeek ? (
                  <span>{t('header.teachingWeek', { week: course.teachingWeek })}</span>
                ) : null}
                <span>{t('header.members', { count: course.memberCount })}</span>
              </div>
            </header>
            <SegmentedTabs<ContextPageKey>
              ariaLabel={t('nav.home')}
              selectedKey={contextPage}
              onSelectionChange={(key) => navigate(`${basePath}/${key}`)}
              size="sm"
              items={[
                { key: 'home', label: t('nav.home') },
                { key: 'info', label: t('nav.info') },
                { key: 'members', label: t('nav.members') },
                { key: 'discussion', label: t('nav.discussion') },
              ]}
              className={styles.contextTabs}
            />
          </>
        ) : null}
        <div className={styles.content}>
          <Outlet context={context} />
        </div>
      </main>
    </div>
  );
}

export default CourseLayout;
