import { Spin } from '@/components/Feedback';
import { useUserService } from '@/domains';
import type { UserAccountProfile } from '@/domains/User';
import { IDENTITY } from '@/domains/User';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccountForm,
  AccountHeader,
  AccountVerification,
  SettingsList,
} from '../_components/Account';
import type { ProfileFieldKey } from '../profile.config';
import { getProfileFieldConfig } from '../profile.config';
import layout from '../style.module.less';
import styles from './style.module.less';

function toDisplayValue(raw: string | null | undefined, emptyLabel: string, pending?: boolean) {
  if (pending || raw == null || raw === '') {
    return { value: emptyLabel, empty: true as const };
  }
  return { value: raw, empty: false as const };
}

function Account() {
  const { t } = useTranslation(['profile', 'common']);
  const userService = useUserService();
  const [user, setUser] = useState<UserAccountProfile | null>(null);
  const emptyLabel = t('form.emptyValue');

  const { loading, runAsync: reloadUserInfo } = useRequest(() => userService.getFullUserInfo(), {
    onSuccess: (data) => {
      setUser(data);
    },
    onError: (err: unknown) => {
      toast.danger(parseErrorMessage(err));
    },
  });

  const identityType = user?.userInfo?.identityType ?? IDENTITY.STUDENT;
  const fieldConfig = getProfileFieldConfig(identityType);
  const readonlyFieldSet = new Set((user?.readonlyFields ?? []) as ProfileFieldKey[]);

  const username = toDisplayValue(user?.userInfo?.username, emptyLabel);
  const campusNo = toDisplayValue(
    user?.userInfo?.campusNo,
    emptyLabel,
    user?.userInfo?.campusNo === 'PENDING'
  );
  const email = toDisplayValue(user?.userInfo?.email, emptyLabel);
  const mobile = toDisplayValue(user?.userInfo?.mobile, emptyLabel);

  const accountItems = [
    { key: 'username', label: t('account.username'), ...username },
    { key: 'campusNo', label: t('account.campusNo'), ...campusNo },
    { key: 'email', label: t('account.email'), ...email },
    { key: 'mobile', label: t('account.mobile'), ...mobile },
  ];

  return (
    <div className={layout.pageContainer}>
      <div className={layout.pageHeader}>
        <h1 className={layout.pageTitle}>{t('account.title')}</h1>
        <span className={layout.pageSubtitle}>{t('account.subtitle')}</span>
      </div>
      <AccountVerification user={user} onUserInfoReload={reloadUserInfo} />
      <Spin spinning={loading}>
        <div className={styles.identitySlot}>
          <AccountHeader user={user} onUserInfoReload={reloadUserInfo} />
        </div>

        <div className={styles.panels}>
          <section className={styles.panel}>
            <h3 className={styles.sectionTitle}>{t('account.sectionTitle')}</h3>
            <SettingsList items={accountItems} />
          </section>

          {fieldConfig.showProfileSection ? (
            <section className={styles.panel}>
              <AccountForm
                show
                user={user}
                fieldConfig={fieldConfig}
                readonlyFieldSet={readonlyFieldSet}
                onUserInfoReload={reloadUserInfo}
              />
            </section>
          ) : null}
        </div>
      </Spin>
    </div>
  );
}

export default Account;
