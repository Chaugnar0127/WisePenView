import {
  consumeActiveAuthContinuation,
  readOptionalRedirectParam,
} from '@/bootstrap/authContinuation';
import AppDisplayDialog from '@/components/Overlay/AppDisplayDialog';
import { useUserService } from '@/domains';
import type { ConfirmEmailVerifyRequest } from '@/domains/User';
import { parseErrorMessage } from '@/utils/error';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { Button, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import auth from '../Auth.module.less';

function VerifyEmail() {
  const userService = useUserService();
  const { t } = useTranslation('auth');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  const { loading, run: runVerify } = useRequest(
    (verifyToken: string) => {
      const params: ConfirmEmailVerifyRequest = { token: verifyToken };
      return userService.confirmEmailVerify(params);
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('verifyEmail.verifySuccess'));
        setSuccessModalOpen(true);
      },
      onError: (err: unknown) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const onVerify = () => {
    if (loading || !token) {
      if (!token) toast.danger(t('verifyEmail.invalidToken'));
      return;
    }
    runVerify(token);
  };

  const goToAccount = () => {
    setSuccessModalOpen(false);
    const queryRedirectPath = readOptionalRedirectParam(window.location.search);
    const continuation = consumeActiveAuthContinuation();
    navigate(queryRedirectPath ?? continuation?.redirectPath ?? APP_ROUTE_PATH.PROFILE_ACCOUNT, {
      replace: true,
      state: { fromVerify: true },
    });
  };

  return (
    <div className={auth.authContainer}>
      <h1>{t('verifyEmail.title')}</h1>
      <div className="mt-3 rounded-medium bg-primary/10 px-4 py-3 text-sm text-primary">
        {t('verifyEmail.alertDescription')}
      </div>
      <div className="mt-6">
        <Button
          variant="primary"
          className={auth.submitButton}
          isDisabled={loading || !token}
          onPress={onVerify}
        >
          {t('verifyEmail.submit')}
        </Button>
      </div>
      <AppDisplayDialog
        isOpen={successModalOpen}
        onOpenChange={(open) => !open && goToAccount()}
        title={t('verifyEmail.successTitle')}
        primaryAction={{
          label: t('verifyEmail.goToAccount'),
          onPress: goToAccount,
        }}
      >
        <p>{t('verifyEmail.successDescription')}</p>
      </AppDisplayDialog>
    </div>
  );
}

export default VerifyEmail;
