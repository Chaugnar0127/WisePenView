import { buildLoginPathForCurrentLocation } from '@/bootstrap/authContinuation';
import { Spin } from '@/components/Feedback';
import { useUserService } from '@/domains';
import { useRequest } from 'ahooks';
import { Navigate, Outlet } from 'react-router-dom';
import styles from './style.module.less';

function AuthenticatedRouteGuard() {
  const userService = useUserService();
  const { data, error, loading } = useRequest(() => userService.getUserInfo());

  if (loading || (!data && !error)) {
    return (
      <div className={styles.state}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to={buildLoginPathForCurrentLocation()} replace />;
  }

  return <Outlet />;
}

export default AuthenticatedRouteGuard;
