import { ResultState, Spin } from '@/components/Feedback';
import { useUserService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { Button } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import styles from './style.module.less';

function AuthenticatedRouteGuard() {
  const { t } = useTranslation('errors');
  const userService = useUserService();
  const { data, error, loading, refresh } = useRequest(() => userService.getUserInfo());

  if (loading || (!data && !error)) {
    return (
      <div className={styles.state}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.state}>
        <ResultState
          status="error"
          title={t('page.sessionCheckFailed')}
          subTitle={error ? parseErrorMessage(error) : t('page.loadFailed')}
          extra={
            <Button variant="primary" onPress={refresh}>
              {t('page.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  return <Outlet />;
}

export default AuthenticatedRouteGuard;
