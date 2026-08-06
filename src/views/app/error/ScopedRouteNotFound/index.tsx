import { ResultState } from '@/components/Feedback';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.less';

export interface ScopedRouteNotFoundProps {
  homePath: string;
  homeLabelKey: 'page.backApp' | 'page.backAdmin';
}

function ScopedRouteNotFound({ homePath, homeLabelKey }: ScopedRouteNotFoundProps) {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <main className={styles.root}>
      <ResultState
        status="404"
        title={t('page.notFoundTitle')}
        subTitle={t('page.notFoundDescription')}
        extra={
          <div className={styles.actions}>
            <Button variant="primary" onPress={() => navigate(homePath)}>
              {t(homeLabelKey)}
            </Button>
            <Button onPress={() => navigate(-1)}>{t('page.backPrevious')}</Button>
          </div>
        }
      />
    </main>
  );
}

export default ScopedRouteNotFound;
