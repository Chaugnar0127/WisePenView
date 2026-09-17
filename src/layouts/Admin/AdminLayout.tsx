import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import {
  RESIZE_TARGET_MINIMUM_SIZE,
  SystemResizableHandle,
  SystemResizablePanel,
  SystemResizablePanelGroup,
} from '@/components/base/SystemResizable';
import AdminSidebar from '@/components/business/Sidebar/AdminSidebar';
import { ADMIN_SIDEBAR_COLLAPSED_WIDTH, MAIN_MIN_WIDTH } from '@/constants/layoutScale';
import SkipToMainLink, { MAIN_CONTENT_ID } from '@/layouts/_common/a11y/SkipToMainLink';
import RouteOutletBoundary from '@/layouts/_common/RouteOutletBoundary';
import { useSystemSidebarPanel } from '@/layouts/MainLayout/useSystemSidebarPanel';

import styles from './AdminLayout.module.less';

const ADMIN_LAYOUT_PANEL_GROUP_ID = 'admin-layout-panels';

function AdminLayout() {
  const { t } = useTranslation('shell');
  const sidebar = useSystemSidebarPanel({
    collapsedWidth: ADMIN_SIDEBAR_COLLAPSED_WIDTH,
    panelGroupId: ADMIN_LAYOUT_PANEL_GROUP_ID,
  });

  return (
    <>
      <SkipToMainLink />
      <SystemResizablePanelGroup
        id={ADMIN_LAYOUT_PANEL_GROUP_ID}
        orientation="horizontal"
        className={styles.root}
        resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
        onLayoutChanged={sidebar.handleLayoutChanged}
      >
        <SystemResizablePanel
          id="admin-sidebar"
          panelRef={sidebar.panelRef}
          defaultSize={sidebar.panelSize}
          minSize={sidebar.minSize}
          maxSize={sidebar.maxSize}
          groupResizeBehavior="preserve-pixel-size"
          className={styles.leftSider}
          aria-label={t('navigation.adminSidebar')}
          onResize={sidebar.handleResize}
        >
          <AdminSidebar collapsed={sidebar.collapsed} onToggle={sidebar.toggle} />
        </SystemResizablePanel>

        <SystemResizableHandle
          collapsed={sidebar.collapsed}
          disabled={sidebar.collapsed}
          aria-label={t('navigation.resizeSidebar')}
        />

        <SystemResizablePanel
          id="admin-main"
          minSize={MAIN_MIN_WIDTH}
          className={styles.middleLayout}
        >
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.middleContent}>
            <RouteOutletBoundary>
              <Outlet />
            </RouteOutletBoundary>
          </main>
        </SystemResizablePanel>
      </SystemResizablePanelGroup>
    </>
  );
}

export default AdminLayout;
