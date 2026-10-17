import { Form } from '@heroui/react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { AppButton } from '@/components/base/Button';
import { FormField, PasswordInput } from '@/components/base/Input';
import AppDisplayDialog from '@/components/business/AppDisplayDialog';
import { useAuthService } from '@/domains';
import type { ChangePasswordRequest } from '@/domains/Auth';
import { useApi } from '@/hooks/useApi';
import { authSessionCoordinator } from '@/utils/auth/authSessionCoordinator';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { type FieldErrors, hasFieldErrors } from '@/utils/validation/formValidation';

import { validateConfirmPasswordField, validatePasswordField } from '../_common/passwordValidation';
import auth from '../_common/style.module.less';

type ChangePasswordFormValues = ChangePasswordRequest & {
  confirmPassword: string;
};
type ChangePasswordField = keyof ChangePasswordFormValues;

const DEFAULT_CHANGE_PASSWORD_VALUES: ChangePasswordFormValues = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function ChangePassword() {
  const authService = useAuthService();
  const { t } = useTranslation('auth');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<ChangePasswordFormValues>(
    DEFAULT_CHANGE_PASSWORD_VALUES
  );
  const [formErrors, setFormErrors] = useState<FieldErrors<ChangePasswordField>>({});
  const navigate = useNavigate();

  const { loading, run: submitChangePassword } = useApi(
    (values: ChangePasswordRequest) => authService.changePassword(values),
    {
      manual: true,
      onSuccess: () => setSuccessModalOpen(true),
    }
  );

  const isFieldEmpty = (field: ChangePasswordField, values: ChangePasswordFormValues): boolean => {
    switch (field) {
      case 'oldPassword':
        return values.oldPassword.length === 0;
      case 'newPassword':
        return values.newPassword.length === 0;
      case 'confirmPassword':
        return values.confirmPassword.length === 0;
      default:
        return false;
    }
  };

  const validateField = (
    field: ChangePasswordField,
    values: ChangePasswordFormValues,
    options: { withRequired?: boolean } = {}
  ): string | undefined => {
    if (!options.withRequired && isFieldEmpty(field, values)) return undefined;

    switch (field) {
      case 'oldPassword':
        return values.oldPassword.length > 0 ? undefined : t('changePassword.oldPasswordRequired');
      case 'newPassword':
        return validatePasswordField(
          values.newPassword,
          {
            required: t('changePassword.passwordRequired'),
            minLength: t('changePassword.passwordMinLength'),
            containsLetter: t('changePassword.passwordContainsLetter'),
            containsNumber: t('changePassword.passwordContainsNumber'),
          },
          options
        );
      case 'confirmPassword':
        return validateConfirmPasswordField(
          values.confirmPassword,
          values.newPassword,
          {
            required: t('changePassword.confirmPasswordRequired'),
            mismatch: t('changePassword.confirmPasswordMismatch'),
          },
          options
        );
      default:
        return undefined;
    }
  };

  const updateFormValue = (field: ChangePasswordField, value: string) => {
    const nextValues = { ...formValues, [field]: value };
    setFormValues(nextValues);
    const fieldsToValidate: ChangePasswordField[] =
      field === 'newPassword' ? ['newPassword', 'confirmPassword'] : [field];
    setFormErrors((prev) => {
      const nextErrors = { ...prev };
      fieldsToValidate.forEach((key) => {
        nextErrors[key] = validateField(key, nextValues);
      });
      return nextErrors;
    });
  };

  const handleFieldBlur = (field: ChangePasswordField) => {
    setFormErrors((prev) => ({ ...prev, [field]: validateField(field, formValues) }));
  };

  const validateForm = () => {
    const nextErrors: FieldErrors<ChangePasswordField> = {
      oldPassword: validateField('oldPassword', formValues, { withRequired: true }),
      newPassword: validateField('newPassword', formValues, { withRequired: true }),
      confirmPassword: validateField('confirmPassword', formValues, { withRequired: true }),
    };
    setFormErrors(nextErrors);
    return !hasFieldErrors(nextErrors);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    submitChangePassword({
      oldPassword: formValues.oldPassword,
      newPassword: formValues.newPassword,
    });
  };

  return (
    <div className={auth.authContainer}>
      <h1 className={auth.title}>{t('changePassword.title')}</h1>
      <Form onSubmit={handleSubmit} className={auth.form}>
        <FormField
          aria-label={t('changePassword.oldPasswordLabel')}
          label={t('changePassword.oldPasswordLabel')}
          name="oldPassword"
          value={formValues.oldPassword}
          onChange={(value) => updateFormValue('oldPassword', value)}
          onBlur={() => handleFieldBlur('oldPassword')}
          errorMessage={formErrors.oldPassword}
          isRequired
        >
          <PasswordInput
            placeholder={t('changePassword.oldPasswordPlaceholder')}
            autoComplete="current-password"
            showPasswordLabel={t('common.showPassword')}
            hidePasswordLabel={t('common.hidePassword')}
          />
        </FormField>

        <FormField
          aria-label={t('changePassword.passwordLabel')}
          label={t('changePassword.passwordLabel')}
          name="newPassword"
          value={formValues.newPassword}
          onChange={(value) => updateFormValue('newPassword', value)}
          onBlur={() => handleFieldBlur('newPassword')}
          errorMessage={formErrors.newPassword}
          isRequired
        >
          <PasswordInput
            placeholder={t('changePassword.passwordPlaceholder')}
            autoComplete="new-password"
            showPasswordLabel={t('common.showPassword')}
            hidePasswordLabel={t('common.hidePassword')}
          />
        </FormField>

        <FormField
          aria-label={t('changePassword.confirmPasswordLabel')}
          label={t('changePassword.confirmPasswordLabel')}
          name="confirmPassword"
          value={formValues.confirmPassword}
          onChange={(value) => updateFormValue('confirmPassword', value)}
          onBlur={() => handleFieldBlur('confirmPassword')}
          errorMessage={formErrors.confirmPassword}
          isRequired
        >
          <PasswordInput
            placeholder={t('changePassword.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            showPasswordLabel={t('common.showPassword')}
            hidePasswordLabel={t('common.hidePassword')}
          />
        </FormField>

        <div className={auth.formActions}>
          <AppButton
            variant="primary"
            size="lg"
            type="submit"
            className={auth.submitButton}
            isDisabled={loading}
          >
            {t('changePassword.submit')}
          </AppButton>
          <div className={auth.centerLinks}>
            <Link to={APP_ROUTE_PATH.AUTH_LOGIN}>{t('changePassword.backToLogin')}</Link>
          </div>
        </div>
      </Form>
      <AppDisplayDialog
        isOpen={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        isDismissable={false}
        showCloseTrigger={false}
        title={t('changePassword.successTitle')}
        primaryAction={{
          label: t('changePassword.goToLogin'),
          onPress: () => {
            setSuccessModalOpen(false);
            navigate(APP_ROUTE_PATH.AUTH_LOGIN, { replace: true });
            authSessionCoordinator.publish('logout');
          },
        }}
      >
        <p>{t('changePassword.successDescription')}</p>
      </AppDisplayDialog>
    </div>
  );
}

export default ChangePassword;
