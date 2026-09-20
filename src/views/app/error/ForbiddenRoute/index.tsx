import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { AppButton } from '@/components/base/Button';
import { ResultState } from '@/components/base/Feedback';
import { ErrorPageActions, ErrorPageShell } from '@/components/business/ErrorPage';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';

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
          <ErrorPageActions>
            <AppButton variant="primary" onPress={() => navigate(-1)}>
              {t('page.backPrevious')}
            </AppButton>
            <AppButton onPress={() => navigate(APP_ROUTE_PATH.CHAT)}>{t('page.backApp')}</AppButton>
          </ErrorPageActions>
        }
      />
    </ErrorPageShell>
  );
}

export default ForbiddenRoute;
