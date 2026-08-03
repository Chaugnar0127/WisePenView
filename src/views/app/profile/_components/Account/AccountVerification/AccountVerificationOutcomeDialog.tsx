import AppDisplayDialog from '@/components/Overlay/AppDisplayDialog';
import { Alert } from '@heroui/react';
import { CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UisOutcomeState } from './index.type';
import styles from './style.module.less';

export interface AccountVerificationOutcomeDialogProps {
  isOpen: boolean;
  uisOutcome: UisOutcomeState | null;
  uisAwaitingScan: boolean;
  uisQrImageSrc: string | null;
  onClose: () => void;
}

function AccountVerificationOutcomeDialog({
  isOpen,
  uisOutcome,
  uisAwaitingScan,
  uisQrImageSrc,
  onClose,
}: AccountVerificationOutcomeDialogProps) {
  const { t } = useTranslation('profile');

  return (
    <AppDisplayDialog
      isOpen={isOpen && uisOutcome != null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={uisAwaitingScan ? t('verification.scanTitle') : t('verification.uisTitle')}
      isDismissable={!uisAwaitingScan}
      footer={uisAwaitingScan ? null : undefined}
      closeText={t('verification.acknowledge')}
    >
      {uisOutcome != null && (
        <div className={styles.uisOutcomeBody}>
          {uisAwaitingScan ? (
            <>
              {uisOutcome.actionPayload.trim() === '' ? (
                <Alert status="warning">
                  <Alert.Indicator>
                    <TriangleAlert size={18} />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Title>{t('verification.qrMissing')}</Alert.Title>
                  </Alert.Content>
                </Alert>
              ) : uisQrImageSrc != null ? (
                <>
                  <Alert className={styles.uisOutcomeHint} status="accent">
                    <Alert.Indicator>
                      <Info size={18} />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>{t('verification.scanHint')}</Alert.Title>
                    </Alert.Content>
                  </Alert>
                  <div className={styles.uisQrWrap}>
                    <img
                      src={uisQrImageSrc}
                      alt={t('verification.qrAlt')}
                      className={styles.uisQrImg}
                    />
                  </div>
                </>
              ) : (
                <Alert status="warning">
                  <Alert.Indicator>
                    <TriangleAlert size={18} />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Title>{t('verification.qrInvalid')}</Alert.Title>
                    <Alert.Description>{t('verification.qrInvalidDescription')}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
            </>
          ) : (
            <Alert status="success">
              <Alert.Indicator>
                <CircleCheck size={18} />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>{t('verification.success')}</Alert.Title>
                {uisOutcome.message.trim() !== '' ? (
                  <Alert.Description>{uisOutcome.message}</Alert.Description>
                ) : null}
              </Alert.Content>
            </Alert>
          )}
        </div>
      )}
    </AppDisplayDialog>
  );
}

export default AccountVerificationOutcomeDialog;
