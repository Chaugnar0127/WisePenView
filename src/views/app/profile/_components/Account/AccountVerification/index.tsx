import AppModal from '@/components/Overlay/AppModal';
import { USER_STATUS } from '@/domains/User';
import { Alert, Button } from '@heroui/react';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VerifyBanner from '../VerifyBanner';
import AccountVerificationForm from './AccountVerificationForm';
import AccountVerificationOutcomeDialog from './AccountVerificationOutcomeDialog';
import type { AccountVerificationProps } from './index.type';
import styles from './style.module.less';
import { useAccountVerificationController } from './useAccountVerificationController';

function AccountVerification({
  user,
  onUserInfoReload,
  defaultOpen = false,
  defaultMode = 'uis',
  showVerifyBanner = true,
  onVerified,
}: AccountVerificationProps) {
  const { t } = useTranslation(['profile', 'common']);
  const [verifyModalOpen, setVerifyModalOpen] = useState(defaultOpen);
  const verification = useAccountVerificationController({
    defaultMode,
    onUserInfoReload,
    onSubmitted: () => setVerifyModalOpen(false),
    onVerified,
  });

  const handleVerify = () => {
    verification.endUisPolling();
    verification.resetVerifyForm();
    setVerifyModalOpen(true);
  };

  const handleVerifyModalClose = () => {
    verification.resetVerifyForm();
    setVerifyModalOpen(false);
  };

  const handleVerifyModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleVerifyModalClose();
      return;
    }

    setVerifyModalOpen(true);
  };

  const showBanner = showVerifyBanner && user?.userInfo?.status === USER_STATUS.UNVERIFIED;

  return (
    <>
      <VerifyBanner visible={showBanner} onGoVerify={handleVerify} />

      <AppModal
        isOpen={verifyModalOpen}
        onOpenChange={handleVerifyModalOpenChange}
        title={t('profile:verification.title')}
        size="md"
        isDismissable={!verification.verifySubmitting}
        actions={
          <>
            <Button
              variant="secondary"
              isDisabled={verification.verifySubmitting}
              onPress={handleVerifyModalClose}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="primary"
              isDisabled={verification.verifySubmitting}
              aria-busy={verification.verifySubmitting || undefined}
              onPress={verification.handleVerifySubmit}
            >
              {verification.verifyMode === 'email'
                ? t('profile:verification.sendEmail')
                : t('profile:verification.startUis')}
            </Button>
          </>
        }
      >
        <Alert className={styles.verifySharedInfo} status="accent">
          <Alert.Indicator>
            <Info size={18} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>{t('profile:verification.description')}</Alert.Description>
          </Alert.Content>
        </Alert>
        <AccountVerificationForm
          formId="account-verification-form"
          verifyMode={verification.verifyMode}
          email={verification.email}
          uisAccount={verification.uisAccount}
          uisPassword={verification.uisPassword}
          verifyFormErrors={verification.verifyFormErrors}
          onModeChange={verification.handleVerifyModeChange}
          onEmailChange={verification.handleEmailChange}
          onUisAccountChange={verification.handleUisAccountChange}
          onUisPasswordChange={verification.handleUisPasswordChange}
          onSubmit={verification.handleVerifyFormSubmit}
        />
      </AppModal>

      <AccountVerificationOutcomeDialog
        isOpen={verification.uisOutcomeOpen}
        uisOutcome={verification.uisOutcome}
        uisAwaitingScan={verification.uisAwaitingScan}
        uisQrImageSrc={verification.uisQrImageSrc}
        onClose={verification.handleUisOutcomeModalClose}
      />
    </>
  );
}

export default AccountVerification;
