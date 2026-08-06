import { Spin } from '@/components/Feedback';
import { useUserService } from '@/domains';
import { IDENTITY } from '@/domains/User';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { useRequest } from 'ahooks';
import { Navigate, Outlet } from 'react-router-dom';
import styles from './AdminRouteGuard.module.less';

function AdminRouteGuard() {
  const userService = useUserService();
  const { data: user, error, loading } = useRequest(() => userService.getUserInfo());

  if (loading || (!user && !error)) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  // 未登录等认证异常交给全局 axios 401 拦截处理，其他异常按非管理员处理。
  if (!user || user.identityType !== IDENTITY.ADMIN) {
    return <Navigate to={APP_ROUTE_PATH.APP} replace />;
  }

  return <Outlet />;
}

export default AdminRouteGuard;
