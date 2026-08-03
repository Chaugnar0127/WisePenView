import CourseCard from '@/components/Course/CourseCard';
import CreateCourseModal from '@/components/Course/CreateCourseModal';
import JoinCourseModal from '@/components/Course/JoinCourseModal';
import { useCourseService, useUserService } from '@/domains';
import type { CourseSummary } from '@/domains/Course';
import { IDENTITY } from '@/domains/User';
import { parseErrorMessage } from '@/utils/error';
import { Button } from '@heroui/react';
import { useRequest } from 'ahooks';
import { CirclePlus, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.less';

function CourseListPage() {
  const { t } = useTranslation(['course', 'common']);
  const courseService = useCourseService();
  const userService = useUserService();
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const coursesRequest = useRequest(() => courseService.listMyCourses({ page: 1, size: 50 }));
  const userRequest = useRequest(() => userService.getUserInfo());
  const canCreateCourse =
    userRequest.data !== undefined && userRequest.data.identityType !== IDENTITY.STUDENT;

  const handleOpenCourse = (course: CourseSummary) => {
    navigate(`/app/course/${course.courseId}/home`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('list.title')}</h1>
          <span className={styles.subtitle}>{t('list.subtitle')}</span>
        </div>
        <div className={styles.headerActions}>
          <Button onPress={() => setJoinOpen(true)}>
            <LogIn size={17} aria-hidden />
            {t('list.join')}
          </Button>
          {canCreateCourse ? (
            <Button variant="primary" onPress={() => setCreateOpen(true)}>
              <CirclePlus size={17} aria-hidden />
              {t('list.create')}
            </Button>
          ) : null}
        </div>
      </header>

      {coursesRequest.loading ? <div className={styles.state}>{t('sidebar.loading')}</div> : null}
      {coursesRequest.error ? (
        <div className={styles.state}>
          <span>{parseErrorMessage(coursesRequest.error)}</span>
          <Button variant="secondary" onPress={coursesRequest.refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}
      {!coursesRequest.loading &&
      !coursesRequest.error &&
      coursesRequest.data?.list.length === 0 ? (
        <div className={styles.state}>{t('list.empty')}</div>
      ) : null}

      {coursesRequest.data?.list.length ? (
        <div className={styles.courseGrid}>
          {coursesRequest.data.list.map((course) => (
            <div key={course.courseId} className={styles.courseGridItem}>
              <CourseCard course={course} onClick={handleOpenCourse} />
            </div>
          ))}
        </div>
      ) : null}

      <JoinCourseModal
        isOpen={joinOpen}
        onOpenChange={setJoinOpen}
        onJoined={coursesRequest.refresh}
      />
      <CreateCourseModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(courseId) => navigate(`/app/course/${courseId}/home`)}
      />
    </div>
  );
}

export default CourseListPage;
