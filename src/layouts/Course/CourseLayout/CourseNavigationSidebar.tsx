import { COURSE_ROLE } from '@/domains/Course';
import { Button } from '@heroui/react';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  Home,
  Settings,
  UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../CourseContext';
import styles from './style.module.less';

function CourseNavigationSidebar() {
  const { t } = useTranslation('course');
  const { course } = useCourseContext();
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
    {
      key: 'announcements',
      label: t('nav.announcements'),
      icon: Bell,
      to: `${basePath}/announcements`,
    },
    { key: 'members', label: t('nav.members'), icon: UsersRound, to: `${basePath}/members` },
    ...(course.myRole === COURSE_ROLE.TEACHER
      ? [
          {
            key: 'edit',
            label: t('nav.edit'),
            icon: Settings,
            to: `${basePath}/edit`,
          },
        ]
      : []),
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Button
          variant="ghost"
          size="sm"
          className={styles.backLink}
          onPress={() => navigate('/app/collaboration?section=courseGroups')}
        >
          <ArrowLeft size={16} aria-hidden />
          {t('common.backToCourseGroups')}
        </Button>
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
    </aside>
  );
}

export default CourseNavigationSidebar;
