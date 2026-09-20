import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { AppButton } from '@/components/base/Button';
import { ResultState } from '@/components/base/Feedback';
import { ErrorPageActions, ErrorPageShell } from '@/components/business/ErrorPage';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';

function ResourceNotFound() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <ErrorPageShell size="sm">
      <ResultState
        status="404"
        title={t('page.notFoundTitle')}
        subTitle={t('page.notFoundDescription')}
        extra={
          <ErrorPageActions>
            <AppButton variant="primary" size="lg" onPress={() => navigate(APP_ROUTE_PATH.HOME)}>
              {t('page.backHome')}
            </AppButton>
            <AppButton size="lg" onPress={() => navigate(-1)}>
              {t('page.backPrevious')}
            </AppButton>
          </ErrorPageActions>
        }
      />
    </ErrorPageShell>
  );
}

export default ResourceNotFound;
