import { ResultState, Spin } from '@/components/Feedback';
import { useCourseService } from '@/domains';
import { CourseContext } from '@/layouts/Course/CourseContext';
import { parseErrorMessage } from '@/utils/error';
import { Button } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import styles from './style.module.less';

function CourseRoute() {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const navigate = useNavigate();
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { data, loading, error, refresh } = useRequest(
    () => courseService.getCourseDetail(courseId),
    { ready: Boolean(courseId), refreshDeps: [courseId] }
  );

  if (loading) {
    return (
      <div className={styles.routeState}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.routeState}>
        <ResultState
          status="error"
          title={t('common.loadFailed')}
          subTitle={error ? parseErrorMessage(error) : t('common.notFound')}
          extra={
            <div className={styles.resultActions}>
              <Button onPress={() => navigate('/app/my-group?section=courseGroups')}>
                {t('common.backToCourseGroups')}
              </Button>
              <Button variant="primary" onPress={refresh}>
                {t('common.retry')}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <CourseContext.Provider value={{ course: data, refreshCourse: refresh }}>
      <Outlet />
    </CourseContext.Provider>
  );
}

export default CourseRoute;
