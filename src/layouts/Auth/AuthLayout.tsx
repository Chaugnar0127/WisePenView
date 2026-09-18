import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import { COLOR_SCHEME_ICON_SRC, useColorScheme } from '@/theme';
import { cn } from '@/utils/cn';

import AuthBackground from './AuthBackground';
import styles from './style.module.less';

function AuthLayout() {
  const { t } = useTranslation('auth');
  const { colorScheme } = useColorScheme();
  const desktopWindow = useDesktopWindowState();
  const titleBarInsetStart =
    desktopWindow.hasTitleBarInset && desktopWindow.titleBarInsetSide === 'start';
  const titleBarInsetEnd =
    desktopWindow.hasTitleBarInset && desktopWindow.titleBarInsetSide === 'end';

  return (
    <main className={styles.root}>
      {desktopWindow.isDesktop ? (
        <div
          className={cn(
            styles.desktopTitleBar,
            titleBarInsetStart && styles.titleBarInsetStart,
            titleBarInsetEnd && styles.titleBarInsetEnd
          )}
          aria-hidden
        />
      ) : null}
      <AuthBackground />
      <div className={styles.authSheet}>
        <section className={styles.formSection} aria-label={t('common.formAria')}>
          <div className={styles.brand}>
            <img
              className={styles.brandIcon}
              src={COLOR_SCHEME_ICON_SRC[colorScheme]}
              alt=""
              draggable={false}
            />
            <span className={styles.brandText}>WisePen</span>
          </div>
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
