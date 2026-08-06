import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import { COLOR_SCHEME_ICON_SRC, useColorScheme } from '@/theme';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { LandingNavbarProps } from './index.type';
import styles from './style.module.less';

function LandingNavbar({ activeKey }: LandingNavbarProps) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const desktopWindow = useDesktopWindowState();
  const { colorScheme } = useColorScheme();
  const navItems = [
    { key: '1', label: t('home.nav.home'), path: APP_ROUTE_PATH.HOME },
    { key: '2', label: t('home.nav.register'), path: APP_ROUTE_PATH.AUTH_REGISTER },
    { key: '3', label: t('home.nav.login'), path: APP_ROUTE_PATH.AUTH_LOGIN },
  ];

  return (
    <div className={clsx(styles.bar, desktopWindow.isDesktop && styles.desktopBar)}>
      <div className={styles.brand}>
        <img src={COLOR_SCHEME_ICON_SRC[colorScheme]} alt="WisePen" className={styles.logo} />
        <span className={styles.brandText}>WisePen</span>
      </div>
      <div className={styles.navWrap} aria-label={t('home.navAria')}>
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={clsx(styles.navButton, activeKey === item.key && styles.navButtonActive)}
            aria-current={activeKey === item.key ? 'page' : undefined}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LandingNavbar;
