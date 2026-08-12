import { Spin } from '@/components/Feedback';
import { useUserService } from '@/domains';
import { useApi } from '@/hooks/useApi';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { Navigate } from 'react-router-dom';
import AnonymousGuardPage from '../AnonymousGuardPage';
import styles from '../AuthenticatedRouteGuard/style.module.less';

function RootRouteGuard() {
  const userService = useUserService();
  const { data, error, loading } = useApi(
    () => userService.getUserInfo({ forceRefresh: true, silentUnauthorized: true }),
    { showErrorToast: false }
  );

  if (loading || (!data && !error)) {
    return (
      <div className={styles.state}>
        <Spin size="large" />
      </div>
    );
  }

  if (data) {
    return <Navigate to={APP_ROUTE_PATH.CHAT} replace />;
  }

  return <AnonymousGuardPage />;
}

export default RootRouteGuard;
