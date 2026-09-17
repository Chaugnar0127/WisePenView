import { Drawer } from '@heroui/react';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { type CSSProperties, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useMatch } from 'react-router-dom';

import wisePenLogo from '@/assets/sidebar_logo/WisePen_Logo.svg';
import AppIconButton from '@/components/base/Button/AppIconButton';
import CommandPaletteTrigger from '@/components/business/CommandPalette/Trigger';
import UserProfile from '@/components/business/Sidebar/_common/footer/UserProfile';
import HeaderNav from '@/components/business/Sidebar/_common/header/HeaderNav';
import AppSidebar from '@/components/business/Sidebar/AppSidebar';
import { useAppSidebarHeaderNav } from '@/components/business/Sidebar/AppSidebar/useAppSidebarHeaderNav';
import { MAIN_SIDEBAR_EXPANDED_WIDTH, MAIN_SIDEBAR_RAIL_WIDTH } from '@/constants/layoutScale';
import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import { useSystemLayoutStore } from '@/layouts/_common/_store/useSystemLayoutStore';
import {
  focusVisibleSidebarToggle,
  SIDEBAR_TOGGLE_BUTTON_PROPS,
} from '@/layouts/_common/a11y/sidebarToggle';
import SkipToMainLink, { MAIN_CONTENT_ID } from '@/layouts/_common/a11y/SkipToMainLink';
import RouteOutletBoundary from '@/layouts/_common/RouteOutletBoundary';
import { useMainLayoutMobileSnapshot } from '@/layouts/_common/useMainLayoutMobile';
import { useAppNavigation } from '@/layouts/AppNavigation/AppNavigationContext';
import { COLOR_SCHEME_ICON_SRC, useColorScheme } from '@/theme';
import { cn } from '@/utils/cn';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';

import AppResourceShell from '../App/AppResourceShell';
import styles from './style.module.less';

interface DrawerOpenState {
  breakpointVersion: number;
  routeKey: string;
}

interface MainHeaderProps {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
}

function MainHeader({ drawerOpen, onOpenDrawer }: MainHeaderProps) {
  const { t } = useTranslation('shell');

  return (
    <header className={styles.mobileHeader}>
      <AppIconButton
        icon={<Menu size={20} aria-hidden="true" />}
        label={t('navigation.expandSidebar')}
        isActive={drawerOpen}
        onPress={onOpenDrawer}
        {...SIDEBAR_TOGGLE_BUTTON_PROPS}
      />
      <img className={styles.mobileLogo} src={wisePenLogo} alt="WisePen" draggable={false} />
    </header>
  );
}

interface MainSidebarRailProps {
  onExpand: () => void;
}

function MainSidebarRail({ onExpand }: MainSidebarRailProps) {
  const { t } = useTranslation('shell');
  const { colorScheme } = useColorScheme();
  const { items, selectedKey } = useAppSidebarHeaderNav();

  return (
    <aside className={styles.rail} aria-label={t('navigation.appSidebar')}>
      <div className={styles.railTop}>
        <img
          className={styles.railLogo}
          src={COLOR_SCHEME_ICON_SRC[colorScheme]}
          alt="WisePen"
          draggable={false}
        />
        <AppIconButton
          icon={<PanelLeftOpen size={18} aria-hidden="true" />}
          label={t('navigation.expandSidebar')}
          onPress={onExpand}
          tooltip={{ placement: 'right' }}
          {...SIDEBAR_TOGGLE_BUTTON_PROPS}
        />
      </div>
      <HeaderNav
        ariaLabel={t('navigation.appAria')}
        activeKey={selectedKey}
        collapsed
        items={items}
        showIndicator
      />
      <div className={styles.railMiddle}>
        <CommandPaletteTrigger />
      </div>
      <UserProfile collapsed />
    </aside>
  );
}

interface MainSidebarDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function MainSidebarDrawer({ isOpen, onOpenChange }: MainSidebarDrawerProps) {
  const { t } = useTranslation('shell');

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop className={styles.drawerBackdrop} isDismissable>
        <Drawer.Content placement="left" className={styles.drawerContent}>
          <Drawer.Dialog className={styles.drawerDialog} aria-label={t('navigation.appSidebar')}>
            <Drawer.Body className={styles.drawerBody}>
              <AppSidebar
                canGoBack={false}
                canGoForward={false}
                onGoBack={() => undefined}
                onGoForward={() => undefined}
                onToggle={() => onOpenChange(false)}
                onNavigate={() => onOpenChange(false)}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

interface MainContentProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const MainContent = memo(function MainContent({
  sidebarCollapsed,
  onToggleSidebar,
}: MainContentProps) {
  const appNavigation = useAppNavigation();
  const isResourceRoute = useMatch(`${APP_ROUTE_PATH.RESOURCES}/:resourceType/:resourceId`) != null;
  const content = isResourceRoute ? (
    <AppResourceShell
      leftSidebarCollapsed={sidebarCollapsed}
      canGoBack={appNavigation.canGoBack}
      canGoForward={appNavigation.canGoForward}
      onGoBack={appNavigation.goBack}
      onGoForward={appNavigation.goForward}
      onToggleLeftSidebar={onToggleSidebar}
    >
      <RouteOutletBoundary>
        <Outlet />
      </RouteOutletBoundary>
    </AppResourceShell>
  ) : (
    <RouteOutletBoundary>
      <Outlet />
    </RouteOutletBoundary>
  );

  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className={cn(styles.mainContent, isResourceRoute && styles.mainContentResource)}
    >
      {content}
    </main>
  );
});

function MainLayout() {
  const appNavigation = useAppNavigation();
  const desktopWindow = useDesktopWindowState();
  const location = useLocation();
  const { breakpointVersion, isMobileLayout } = useMainLayoutMobileSnapshot();
  const sidebarCollapsed = useSystemLayoutStore((state) => state.mainSidebarCollapsed);
  const setSidebarCollapsed = useSystemLayoutStore((state) => state.setMainSidebarCollapsed);
  const [drawerOpenState, setDrawerOpenState] = useState<DrawerOpenState | null>(null);
  const drawerOpen =
    isMobileLayout &&
    drawerOpenState?.routeKey === location.key &&
    drawerOpenState.breakpointVersion === breakpointVersion;

  const setDrawerOpen = (open: boolean) => {
    setDrawerOpenState(open ? { breakpointVersion, routeKey: location.key } : null);
  };

  const handleToggleSidebar = () => {
    if (isMobileLayout) {
      setDrawerOpenState((openState) =>
        openState?.routeKey === location.key && openState.breakpointVersion === breakpointVersion
          ? null
          : { breakpointVersion, routeKey: location.key }
      );
      return;
    }
    setSidebarCollapsed(!sidebarCollapsed);
    focusVisibleSidebarToggle();
  };

  return (
    <div
      className={cn(
        styles.root,
        sidebarCollapsed && styles.rootCollapsed,
        isMobileLayout && styles.rootMobile
      )}
      style={
        {
          '--main-sidebar-current-width': `${
            sidebarCollapsed ? MAIN_SIDEBAR_RAIL_WIDTH : MAIN_SIDEBAR_EXPANDED_WIDTH
          }px`,
        } as CSSProperties
      }
      data-main-sidebar-collapsed={sidebarCollapsed || undefined}
    >
      <SkipToMainLink />
      {!isMobileLayout ? (
        sidebarCollapsed ? (
          <MainSidebarRail onExpand={handleToggleSidebar} />
        ) : (
          <AppSidebar
            canGoBack={appNavigation.canGoBack}
            canGoForward={appNavigation.canGoForward}
            onGoBack={appNavigation.goBack}
            onGoForward={appNavigation.goForward}
            onToggle={handleToggleSidebar}
          />
        )
      ) : null}

      <div
        className={cn(
          styles.mainColumn,
          desktopWindow.hasTitleBarInset &&
            desktopWindow.titleBarInsetSide === 'end' &&
            styles.titleBarInsetEnd
        )}
      >
        {isMobileLayout ? (
          <MainHeader drawerOpen={drawerOpen} onOpenDrawer={() => setDrawerOpen(true)} />
        ) : null}
        <MainContent sidebarCollapsed={sidebarCollapsed} onToggleSidebar={handleToggleSidebar} />
      </div>

      {isMobileLayout ? (
        <MainSidebarDrawer isOpen={drawerOpen} onOpenChange={setDrawerOpen} />
      ) : null}
    </div>
  );
}

export default MainLayout;
