import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import AppNavigationControls from '@/layouts/AppNavigation/AppNavigationControls';
import { COLOR_SCHEME_ICON_SRC, useColorScheme } from '@/theme';
import clsx from 'clsx';
import type { SidebarHeaderProps } from './index.type';
import styles from './style.module.less';

function SidebarHeader({
  collapsed,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onToggle,
  title = 'WisePen',
  nav,
}: SidebarHeaderProps) {
  const hasNav = Boolean(nav);
  const desktopWindow = useDesktopWindowState();
  const { colorScheme } = useColorScheme();
  const logoContent = (
    <>
      <div className={styles.logoIcon}>
        <img src={COLOR_SCHEME_ICON_SRC[colorScheme]} alt="WisePen" draggable={false} />
      </div>
      <span className={styles.logoText}>{title}</span>
    </>
  );
  const navigationControls =
    onToggle && onGoBack && onGoForward ? (
      <AppNavigationControls
        sidebarCollapsed={collapsed}
        showHistory={desktopWindow.isDesktop}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onToggleSidebar={onToggle}
      />
    ) : null;

  return (
    <div
      className={clsx(
        styles.header,
        desktopWindow.isDesktop && styles.desktopHeader,
        desktopWindow.hasTitleBarInset &&
          desktopWindow.titleBarInsetSide === 'start' &&
          styles.titleBarInsetStart
      )}
    >
      {desktopWindow.isDesktop ? (
        <>
          <div className={clsx(styles.headerTop, collapsed && styles.collapsedHeaderTop)}>
            {navigationControls}
          </div>
          {!collapsed ? <div className={styles.logo}>{logoContent}</div> : null}
        </>
      ) : (
        <div className={clsx(styles.webHeader, collapsed && styles.collapsedWebHeader)}>
          {!collapsed ? <div className={styles.logo}>{logoContent}</div> : null}
          {navigationControls}
        </div>
      )}

      {hasNav ? (
        <div className={clsx(styles.headerNav, collapsed && styles.headerNavCollapsed)}>{nav}</div>
      ) : null}
    </div>
  );
}

export default SidebarHeader;
