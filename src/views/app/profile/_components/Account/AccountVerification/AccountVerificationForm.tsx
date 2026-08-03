import { Input, InputGroup } from '@/components/Input';
import { ErrorMessage, Form, Label, Tabs, TextField } from '@heroui/react';
import { Mail, ShieldUser } from 'lucide-react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { VerifyFormErrors, VerifyModalMode } from './index.type';
import styles from './style.module.less';

export interface AccountVerificationFormProps {
  formId?: string;
  verifyMode: VerifyModalMode;
  email: string;
  uisAccount: string;
  uisPassword: string;
  verifyFormErrors: VerifyFormErrors;
  onModeChange: (mode: VerifyModalMode) => void;
  onEmailChange: (email: string) => void;
  onUisAccountChange: (account: string) => void;
  onUisPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function AccountVerificationForm({
  formId,
  verifyMode,
  email,
  uisAccount,
  uisPassword,
  verifyFormErrors,
  onModeChange,
  onEmailChange,
  onUisAccountChange,
  onUisPasswordChange,
  onSubmit,
}: AccountVerificationFormProps) {
  const { t } = useTranslation('profile');

  return (
    <>
      <Tabs
        className={styles.verifyModeTabs}
        selectedKey={verifyMode}
        onSelectionChange={(nextMode) => onModeChange(String(nextMode) as VerifyModalMode)}
      >
        <Tabs.ListContainer className={styles.verifyModeTabsListContainer}>
          <Tabs.List
            className={styles.verifyModeTabsList}
            aria-label={t('verification.methodAria')}
          >
            <Tabs.Tab className={styles.verifyModeTab} id="uis">
              {t('verification.uisTab')}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab className={styles.verifyModeTab} id="email">
              {t('verification.emailTab')}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <Form id={formId} onSubmit={onSubmit} className={styles.verifyForm}>
        {verifyMode === 'email' ? (
          <TextField
            value={email}
            onChange={onEmailChange}
            isInvalid={verifyFormErrors.email != null}
            name="email"
          >
            <Label>{t('verification.emailLabel')}</Label>
            <InputGroup>
              <InputGroup.Prefix>
                <Mail size={18} className={styles.verifyInputIcon} />
              </InputGroup.Prefix>
              <InputGroup.Input type="email" placeholder={t('verification.emailPlaceholder')} />
            </InputGroup>
            <ErrorMessage>{verifyFormErrors.email}</ErrorMessage>
          </TextField>
        ) : (
          <>
            <TextField
              value={uisAccount}
              onChange={onUisAccountChange}
              isInvalid={verifyFormErrors.uisAccount != null}
              name="uisAccount"
            >
              <Label>{t('verification.uisAccountLabel')}</Label>
              <InputGroup>
                <InputGroup.Prefix>
                  <ShieldUser size={18} className={styles.verifyInputIcon} />
                </InputGroup.Prefix>
                <InputGroup.Input
                  placeholder={t('verification.uisAccountPlaceholder')}
                  autoComplete="username"
                />
              </InputGroup>
              <ErrorMessage>{verifyFormErrors.uisAccount}</ErrorMessage>
            </TextField>
            <TextField
              value={uisPassword}
              onChange={onUisPasswordChange}
              isInvalid={verifyFormErrors.uisPassword != null}
              name="uisPassword"
            >
              <Label>{t('verification.uisPasswordLabel')}</Label>
              <Input
                type="password"
                placeholder={t('verification.uisPasswordLabel')}
                autoComplete="current-password"
              />
              <ErrorMessage>{verifyFormErrors.uisPassword}</ErrorMessage>
            </TextField>
          </>
        )}
      </Form>
    </>
  );
}

export default AccountVerificationForm;
