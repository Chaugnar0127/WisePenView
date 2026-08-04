import AppBanner from '@/components/Overlay/AppBanner';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import type { VerifyBannerProps } from './index.type';
import styles from './style.module.less';

function VerifyBanner({ visible, onGoVerify }: VerifyBannerProps) {
  const { t } = useTranslation('profile');

  if (!visible) return null;
  return (
    <AppBanner
      status="warning"
      className={styles.statusBanner}
      description={t('verification.banner')}
      action={
        <Button size="sm" variant="primary" onPress={onGoVerify}>
          {t('verification.goVerify')}
        </Button>
      }
    />
  );
}

export default VerifyBanner;
