import AppAvatar from '@/components/Avatar';
import { AppButton } from '@/components/Button';
import { AppMenu } from '@/components/Overlay';
import AppDisplayDialog from '@/components/Overlay/AppDisplayDialog';
import { useUserService } from '@/domains';
import type { User } from '@/domains/User';
import { IDENTITY } from '@/domains/User';
import { useAppAuth } from '@/layouts/App/AppAuthContext';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';

import { useMount } from 'ahooks';
import clsx from 'clsx';
import {
  ChartPie,
  Home,
  Info,
  LogIn,
  LogOut,
  MessageSquare,
  Palette,
  Settings,
  Shield,
  ShieldUser,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuthService } from '@/domains';
import { COLOR_SCHEME_ICON_SRC, useColorScheme } from '@/theme';
import UserFeedbackModal from '../UserFeedbackModal';
import styles from './style.module.less';

interface UserProfileProps {
  collapsed: boolean;
  menuMode?: 'app' | 'admin';
}

function UserProfile({ collapsed, menuMode = 'app' }: UserProfileProps) {
  const { t } = useTranslation(['shell', 'common']);
  const navigate = useNavigate();
  const appAuth = useAppAuth();
  const userService = useUserService();
  const { colorScheme } = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const authService = useAuthService();

  useMount(() => {
    if (!appAuth.isAuthenticated) return;
    void userService.getUserInfo().then(setUser);
  });

  const displayName = user?.nickname || user?.username || '-';
  const identityKey =
    user?.identityType !== undefined ? IDENTITY.getKey(user.identityType) : undefined;
  const identityLabel = identityKey
    ? t(`role.${identityKey}`)
    : t('placeholder.dash', { ns: 'common' });
  const isAdmin = user?.identityType === IDENTITY.ADMIN;

  if (!appAuth.isAuthenticated) {
    const handleLogin = () => navigate(appAuth.loginPath);

    return (
      <div className={clsx(styles.profile, !collapsed && styles.expanded)}>
        {collapsed ? (
          <button
            type="button"
            className={styles.avatarTrigger}
            aria-label={t('anonymous.login')}
            onClick={handleLogin}
          >
            <LogIn size={18} aria-hidden="true" />
          </button>
        ) : (
          <>
            <AppAvatar size="sm" className={styles.avatar}>
              <AppAvatar.Fallback>{t('anonymous.avatar')}</AppAvatar.Fallback>
            </AppAvatar>
            <div className={styles.info}>
              <span className={styles.username}>{t('anonymous.title')}</span>
              <span className={styles.tag}>{t('anonymous.subtitle')}</span>
            </div>
            <AppButton
              size="sm"
              variant="primary"
              className={styles.loginButton}
              onPress={handleLogin}
            >
              {t('anonymous.login')}
            </AppButton>
          </>
        )}
      </div>
    );
  }

  const handleMenuAction = (key: React.Key) => {
    switch (key) {
      case 'enter-admin':
        navigate(APP_ROUTE_PATH.ADMIN_USERS);
        break;
      case 'back-app':
        navigate(APP_ROUTE_PATH.APP);
        break;
      case 'usage':
        navigate(APP_ROUTE_PATH.PROFILE_USAGE);
        break;
      case 'account':
        navigate(APP_ROUTE_PATH.PROFILE_ACCOUNT);
        break;
      case 'appearance':
        navigate(APP_ROUTE_PATH.PROFILE_APPEARANCE);
        break;
      case 'feedback':
        setFeedbackModalOpen(true);
        break;
      case 'about':
        setAboutDialogOpen(true);
        break;
      // case 'language':
      //   break;
      // case 'theme':
      //   break;
      case 'logout':
        void authService.logout();
        break;
      default:
        break;
    }
  };

  const userAvatar = (
    <AppAvatar size="sm" className={styles.avatar}>
      {user?.avatar ? <AppAvatar.Image src={user.avatar} alt={displayName} /> : null}
      <AppAvatar.Fallback>{displayName.charAt(0).toUpperCase()}</AppAvatar.Fallback>
    </AppAvatar>
  );

  const userMenu = (
    <AppMenu.Popover placement="top left" className={styles.profileMenuPopover} bodyPadding="none">
      <AppMenu.Menu
        aria-label={t('userMenu.aria')}
        className={styles.profileMenu}
        onAction={handleMenuAction}
      >
        {menuMode === 'admin' ? (
          <>
            <AppMenu.Item
              id="back-app"
              textValue={t('userMenu.backToApp')}
              className={styles.profileMenuItem}
            >
              <Home size={16} />
              <span>{t('userMenu.backToApp')}</span>
            </AppMenu.Item>
            <AppMenu.Item
              id="about"
              textValue={t('userMenu.about')}
              className={styles.profileMenuItem}
            >
              <Info size={16} />
              <span>{t('userMenu.about')}</span>
            </AppMenu.Item>
            <AppMenu.DangerItem
              id="logout"
              textValue={t('userMenu.logout')}
              className={styles.profileMenuItem}
            >
              <LogOut size={16} />
              <span>{t('userMenu.logout')}</span>
            </AppMenu.DangerItem>
          </>
        ) : (
          <>
            <AppMenu.Item
              id="usage"
              textValue={t('userMenu.usage')}
              className={styles.profileMenuItem}
            >
              <ChartPie size={16} />
              <span>{t('userMenu.usage')}</span>
            </AppMenu.Item>
            <AppMenu.Item
              id="account"
              textValue={t('userMenu.account')}
              className={styles.profileMenuItem}
            >
              <ShieldUser size={16} />
              <span>{t('userMenu.account')}</span>
            </AppMenu.Item>
            <AppMenu.Item
              id="appearance"
              textValue={t('userMenu.appearance')}
              className={styles.profileMenuItem}
            >
              <Palette size={16} />
              <span>{t('userMenu.appearance')}</span>
            </AppMenu.Item>
            <AppMenu.Item
              id="feedback"
              textValue={t('userMenu.feedback')}
              className={styles.profileMenuItem}
            >
              <MessageSquare size={16} />
              <span>{t('userMenu.feedback')}</span>
            </AppMenu.Item>
            {isAdmin && (
              <AppMenu.Item
                id="enter-admin"
                textValue={t('userMenu.enterAdmin')}
                className={styles.profileMenuItem}
              >
                <Shield size={16} />
                <span>{t('userMenu.enterAdmin')}</span>
              </AppMenu.Item>
            )}
            <AppMenu.Item
              id="about"
              textValue={t('userMenu.about')}
              className={styles.profileMenuItem}
            >
              <Info size={16} />
              <span>{t('userMenu.about')}</span>
            </AppMenu.Item>
            <AppMenu.DangerItem
              id="logout"
              textValue={t('userMenu.logout')}
              className={styles.profileMenuItem}
            >
              <LogOut size={16} />
              <span>{t('userMenu.logout')}</span>
            </AppMenu.DangerItem>
          </>
        )}
      </AppMenu.Menu>
    </AppMenu.Popover>
  );

  return (
    <>
      <div className={clsx(styles.profile, !collapsed && styles.expanded)}>
        {collapsed ? (
          <AppMenu>
            <AppMenu.Trigger aria-label={t('userMenu.openAria')} className={styles.avatarTrigger}>
              {userAvatar}
            </AppMenu.Trigger>
            {userMenu}
          </AppMenu>
        ) : (
          <>
            {userAvatar}
            <div className={styles.info}>
              <span className={styles.username}>{displayName}</span>
              <span className={styles.tag}>{identityLabel}</span>
            </div>
            <AppMenu>
              <AppMenu.Trigger
                aria-label={t('userMenu.openSettingsAria')}
                className={styles.menuTrigger}
              >
                <Settings size={16} aria-hidden="true" />
              </AppMenu.Trigger>
              {userMenu}
            </AppMenu>
          </>
        )}
      </div>

      <AppDisplayDialog
        isOpen={aboutDialogOpen}
        onOpenChange={setAboutDialogOpen}
        title={t('userMenu.aboutTitle')}
        closeText={t('actions.close', { ns: 'common' })}
      >
        <div className={styles.aboutContent}>
          <img className={styles.aboutLogo} src={COLOR_SCHEME_ICON_SRC[colorScheme]} alt="" />
          <div className={styles.aboutProductName}>WisePen</div>
          <div className={styles.aboutVersion}>
            {t('userMenu.version', { version: __APP_VERSION__ })}
          </div>
        </div>
      </AppDisplayDialog>

      <UserFeedbackModal isOpen={feedbackModalOpen} onOpenChange={setFeedbackModalOpen} />
    </>
  );
}

export default UserProfile;
