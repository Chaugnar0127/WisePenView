import { ResultState } from '@/components/Feedback';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.less';

function ForbiddenRoute() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <main className={styles.root}>
      <ResultState
        status="403"
        title={t('page.forbiddenTitle')}
        subTitle={t('page.forbiddenDescription')}
        extra={
          <div className={styles.actions}>
            <Button variant="primary" onPress={() => navigate(-1)}>
              {t('page.backPrevious')}
            </Button>
            <Button onPress={() => navigate(APP_ROUTE_PATH.APP)}>{t('page.backApp')}</Button>
          </div>
        }
      />
    </main>
  );
}

export default ForbiddenRoute;
