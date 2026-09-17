import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import UserProfile from '@/components/business/Sidebar/_common/footer/UserProfile';
import AdminSidebar from '@/components/business/Sidebar/AdminSidebar';
import AdminHeaderNav from '@/components/business/Sidebar/AdminSidebar/AdminHeaderNav';
import { MAIN_MIN_WIDTH } from '@/constants/layoutScale';
import MainShell from '@/layouts/MainShell';
import RouteOutletBoundary from '@/layouts/RouteOutletBoundary';

import styles from './style.module.less';

const ADMIN_LAYOUT_PANEL_GROUP_ID = 'admin-layout-panels';

function AdminSidebarRailContent() {
  return (
    <>
      <AdminHeaderNav collapsed />
      <UserProfile collapsed menuMode="admin" />
    </>
  );
}

function AdminLayout() {
  const { t } = useTranslation('shell');

  return (
    <MainShell
      panelGroupId={ADMIN_LAYOUT_PANEL_GROUP_ID}
      sidebarAriaLabel={t('navigation.adminSidebar')}
      mainMinWidth={MAIN_MIN_WIDTH}
      mainContentScroll
      mobileHeaderTitle={<span className={styles.mobileTitle}>WisePen Admin</span>}
      railContent={<AdminSidebarRailContent />}
      renderSidebar={({ onToggle }) => <AdminSidebar onToggle={onToggle} />}
      renderDrawerSidebar={({ onNavigate }) => <AdminSidebar onToggle={onNavigate} />}
    >
      <RouteOutletBoundary>
        <Outlet />
      </RouteOutletBoundary>
    </MainShell>
  );
}

export default AdminLayout;
