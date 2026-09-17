import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import wisePenLogo from '@/assets/sidebar_logo/WisePen_Logo.svg';
import AppSidebar from '@/components/business/Sidebar/AppSidebar';
import { APP_MAIN_MIN_WIDTH } from '@/constants/layoutScale';
import { useAppNavigation } from '@/layouts/AppNavigation/AppNavigationContext';
import MainShell from '@/layouts/MainShell';
import RouteOutletBoundary from '@/layouts/RouteOutletBoundary';

import styles from './style.module.less';

const APP_LAYOUT_PANEL_GROUP_ID = 'app-layout-panels';

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
      renderSidebar={({ collapsed, motionPhase, onToggle }) => (
        <AppSidebar
          canGoBack={appNavigation.canGoBack}
          canGoForward={appNavigation.canGoForward}
          collapsed={collapsed}
          motionPhase={motionPhase}
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
