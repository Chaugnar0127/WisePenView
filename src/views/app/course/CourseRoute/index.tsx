import { ResultState, Spin } from '@/components/Feedback';
import { useCourseService } from '@/domains';
import { useApi } from '@/hooks/useApi';
import { CourseContext } from '@/layouts/Course/CourseContext';
import { parseErrorMessage } from '@/utils/error';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { Button } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import styles from './style.module.less';

function CourseRoute() {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const navigate = useNavigate();
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { data, loading, error, refresh } = useApi(() => courseService.getCourseDetail(courseId), {
    ready: Boolean(courseId),
    refreshDeps: [courseId],
  });

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
              <Button variant="ghost" onPress={() => navigate(APP_ROUTE_PATH.COURSES)}>
                <ArrowLeft size={16} aria-hidden />
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
