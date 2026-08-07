import { ResultState } from '@/components/Feedback';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import ErrorPageShell from '@/views/app/error/_components/ErrorPageShell';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import shellStyles from '../_components/ErrorPageShell/style.module.less';

function ForbiddenRoute() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <ErrorPageShell size="sm">
      <ResultState
        status="403"
        title={t('page.forbiddenTitle')}
        subTitle={t('page.forbiddenDescription')}
        extra={
          <div className={shellStyles.actions}>
            <Button variant="primary" onPress={() => navigate(-1)}>
              {t('page.backPrevious')}
            </Button>
            <Button onPress={() => navigate(APP_ROUTE_PATH.APP)}>{t('page.backApp')}</Button>
          </div>
        }
      />
    </ErrorPageShell>
  );
}

export default ForbiddenRoute;
