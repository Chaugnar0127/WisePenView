import { useCourseRouteContext } from '@/views/app/course/context';
import { BookOpen, ClipboardCheck, FolderOpen, Home, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './CourseLayout.module.less';

function CourseNavigationSidebar() {
  const { t } = useTranslation('course');
  const { course } = useCourseRouteContext();
  const navigate = useNavigate();
  const basePath = `/app/course/${course.courseId}`;
  const navItems = [
    { key: 'home', label: t('nav.home'), icon: Home, to: `${basePath}/home` },
    { key: 'learning', label: t('nav.learning'), icon: BookOpen, to: `${basePath}/learning` },
    {
      key: 'assignments',
      label: t('nav.assignments'),
      icon: ClipboardCheck,
      to: `${basePath}/assignments`,
      badge: course.pendingAssignmentCount,
    },
    { key: 'materials', label: t('nav.materials'), icon: FolderOpen, to: `${basePath}/materials` },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/app/course')}>
          {t('common.backToCourses')}
        </button>
        <div className={styles.courseName}>
          <BookOpen size={18} aria-hidden />
          <strong>{course.name}</strong>
        </div>
      </div>
      <nav className={styles.courseNav} aria-label={t('nav.home')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <Icon size={17} aria-hidden />
              <span>{item.label}</span>
              {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
            </NavLink>
          );
        })}
      </nav>
      {course.capabilities.canEditCourse ? (
        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.editButton} disabled>
            <Settings2 size={17} aria-hidden />
            {t('nav.edit')}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

export default CourseNavigationSidebar;
