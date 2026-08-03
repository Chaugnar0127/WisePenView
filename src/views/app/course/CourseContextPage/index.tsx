import { COURSE_ROLE } from '@/domains/Course';
import { useCourseContext } from '@/layouts/Course/CourseContext';
import { Button, Link, Tabs } from '@heroui/react';
import { linkVariants } from '@heroui/styles';
import { SlidersHorizontal, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import CourseAnnouncementsTab from './_components/CourseAnnouncementsTab';
import CourseHomeTab from './_components/CourseHomeTab';
import CourseInfoTab from './_components/CourseInfoTab';
import CourseMembersTab from './_components/CourseMembersTab';
import styles from './style.module.less';

const COURSE_CONTEXT_TAB_KEYS = ['home', 'info', 'members', 'announcements'] as const;
type CourseContextTabKey = (typeof COURSE_CONTEXT_TAB_KEYS)[number];

const resolveInitialTab = (value: string | null): CourseContextTabKey =>
  COURSE_CONTEXT_TAB_KEYS.includes(value as CourseContextTabKey)
    ? (value as CourseContextTabKey)
    : 'home';

function CourseContextPage() {
  const { t } = useTranslation('course');
  const { course } = useCourseContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTabKey, setActiveTabKey] = useState<CourseContextTabKey>(() =>
    resolveInitialTab(searchParams.get('tab'))
  );
  const basePath = `/app/course/${course.courseId}`;

  const tabItems = [
    { key: 'home', label: t('nav.home') },
    { key: 'info', label: t('nav.info') },
    { key: 'members', label: t('nav.members') },
    { key: 'announcements', label: t('nav.announcements') },
  ] satisfies { key: CourseContextTabKey; label: string }[];

  const activeTabContent = (() => {
    switch (activeTabKey) {
      case 'info':
        return <CourseInfoTab />;
      case 'members':
        return <CourseMembersTab />;
      case 'announcements':
        return <CourseAnnouncementsTab />;
      default:
        return <CourseHomeTab onViewAnnouncements={() => setActiveTabKey('announcements')} />;
    }
  })();

  return (
    <div className={styles.root}>
      <header className={styles.courseHeader}>
        <div className={styles.courseKicker}>
          {course.term} · {course.category}
        </div>
        <div className={styles.courseTitleRow}>
          <h1>{course.name}</h1>
          <div className={styles.courseActions}>
            {course.myRole === COURSE_ROLE.TEACHER ? (
              <Button variant="primary" onPress={() => navigate(`${basePath}/edit`)}>
                <SlidersHorizontal size={17} aria-hidden />
                {t('nav.edit')}
              </Button>
            ) : null}
            <RouterLink
              className={`${linkVariants().base()} ${styles.contextLink}`}
              to={`/app/my-group/${course.courseId}`}
            >
              <Link.Icon className={`${linkVariants().icon()} ${styles.contextLinkIcon}`}>
                <UsersRound aria-hidden />
              </Link.Icon>
              {t('nav.goToCourseGroup')}
            </RouterLink>
          </div>
        </div>
        <p>{course.description}</p>
        <div className={styles.courseMeta}>
          <span>{course.teacher.name}</span>
          {course.teachingWeek ? (
            <span>{t('header.teachingWeek', { week: course.teachingWeek })}</span>
          ) : null}
          <span>{t('header.members', { count: course.memberCount })}</span>
        </div>
      </header>

      <Tabs
        variant="secondary"
        selectedKey={activeTabKey}
        onSelectionChange={(key) => {
          const nextKey = String(key);
          if (COURSE_CONTEXT_TAB_KEYS.includes(nextKey as CourseContextTabKey)) {
            setActiveTabKey(nextKey as CourseContextTabKey);
          }
        }}
        className={styles.contextTabs}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('nav.contextTabsAria')}>
            {tabItems.map((item) => (
              <Tabs.Tab key={item.key} id={item.key}>
                {item.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div
        className={`${styles.tabContent} ${activeTabKey === 'home' ? styles.homeTabContent : ''}`}
      >
        {activeTabContent}
      </div>
    </div>
  );
}

export default CourseContextPage;
