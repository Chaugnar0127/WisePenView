import ErrorPageShell from '@/views/app/error/_components/ErrorPageShell';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ResultState } from '@/components/Feedback';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import shellStyles from '../_components/ErrorPageShell/style.module.less';

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
          <div className={shellStyles.actions}>
            <Button
              variant="primary"
              size="lg"
              onPress={() => navigate(APP_ROUTE_PATH.PUBLIC_CHAT)}
            >
              {t('page.backHome')}
            </Button>
            <Button size="lg" onPress={() => navigate(-1)}>
              {t('page.backPrevious')}
            </Button>
          </div>
        }
      />
    </ErrorPageShell>
  );
}

export default ResourceNotFound;
