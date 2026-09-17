import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import wisePenLogo from '@/assets/sidebar_logo/WisePen_Logo.svg';
import CommandPaletteTrigger from '@/components/business/CommandPalette/Trigger';
import UserProfile from '@/components/business/Sidebar/_common/footer/UserProfile';
import HeaderNav from '@/components/business/Sidebar/_common/header/HeaderNav';
import AppSidebar from '@/components/business/Sidebar/AppSidebar';
import { useAppSidebarHeaderNav } from '@/components/business/Sidebar/AppSidebar/useAppSidebarHeaderNav';
import { APP_MAIN_MIN_WIDTH } from '@/constants/layoutScale';
import RouteOutletBoundary from '@/layouts/_common/RouteOutletBoundary';
import { useAppNavigation } from '@/layouts/AppNavigation/AppNavigationContext';
import MainShell from '@/layouts/MainShell';

import styles from './style.module.less';

const APP_LAYOUT_PANEL_GROUP_ID = 'app-layout-panels';

function AppSidebarRailContent() {
  const { t } = useTranslation('shell');
  const { items, selectedKey } = useAppSidebarHeaderNav();

  return (
    <>
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
    </>
  );
}

function AppLayout() {
  const { t } = useTranslation('shell');
  const appNavigation = useAppNavigation();

  return (
    <MainShell
      panelGroupId={APP_LAYOUT_PANEL_GROUP_ID}
      sidebarAriaLabel={t('navigation.appSidebar')}
      mainMinWidth={APP_MAIN_MIN_WIDTH}
      mobileHeaderTitle={
        <img className={styles.mobileLogo} src={wisePenLogo} alt="WisePen" draggable={false} />
      }
      railContent={<AppSidebarRailContent />}
      renderSidebar={({ onToggle }) => (
        <AppSidebar
          canGoBack={appNavigation.canGoBack}
          canGoForward={appNavigation.canGoForward}
          onGoBack={appNavigation.goBack}
          onGoForward={appNavigation.goForward}
          onToggle={onToggle}
        />
      )}
      renderDrawerSidebar={({ onNavigate }) => (
        <AppSidebar
          canGoBack={false}
          canGoForward={false}
          onGoBack={() => undefined}
          onGoForward={() => undefined}
          onToggle={onNavigate}
          onNavigate={onNavigate}
        />
      )}
    >
      <RouteOutletBoundary>
        <Outlet />
      </RouteOutletBoundary>
    </MainShell>
  );
}

export default AppLayout;
