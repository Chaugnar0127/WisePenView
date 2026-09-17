import { Drawer } from '@heroui/react';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import AppIconButton from '@/components/base/Button/AppIconButton';
import {
  RESIZE_TARGET_MINIMUM_SIZE,
  SystemResizableHandle,
  SystemResizablePanel,
  SystemResizablePanelGroup,
} from '@/components/base/SystemResizable';
import { MAIN_SIDEBAR_RAIL_WIDTH } from '@/constants/layoutScale';
import { SIDEBAR_TOGGLE_BUTTON_PROPS } from '@/constants/sidebarToggle';
import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import { COLOR_SCHEME_ICON_SRC, useColorScheme } from '@/theme';
import { cn } from '@/utils/cn';

import { MainShellContext, type MainShellContextValue } from './MainShellContext';
import SkipToMainLink, { MAIN_CONTENT_ID } from './SkipToMainLink';
import styles from './style.module.less';
import { useMainShellMobileSnapshot } from './useMainShellMobile';
import { useSystemSidebarPanel } from './useSystemSidebarPanel';

interface MainSidebarRenderState {
  /** 折叠侧栏；折叠态由壳内的 rail 承担，不再渲染侧栏内容 */
  onToggle: () => void;
}

interface MainDrawerSidebarRenderState {
  /** 窄屏侧栏项被选中后关闭 Drawer */
  onNavigate: () => void;
}

interface MainShellProps {
  /** panel group 的 DOM id，同时作为布局标识 */
  panelGroupId: string;
  /** 侧栏 aria-label */
  sidebarAriaLabel: string;
  /** 主内容区最小宽度 */
  mainMinWidth?: number;
  /** 主内容区自身滚动；页面自声明框架（如 AppScrollablePageLayout）时为 false */
  mainContentScroll?: boolean;
  /** 展开态侧栏内容 */
  renderSidebar: (state: MainSidebarRenderState) => ReactNode;
  /** 折叠态 rail 内的导航内容，rail 框架与展开按钮由壳提供 */
  railContent: ReactNode;
  /** 窄屏 Drawer 内的侧栏内容 */
  renderDrawerSidebar: (state: MainDrawerSidebarRenderState) => ReactNode;
  /** 窄屏顶栏标题，不传则不渲染窄屏顶栏 */
  mobileHeaderTitle?: ReactNode;
  children: ReactNode;
}

interface DrawerOpenState {
  breakpointVersion: number;
  routeKey: string;
}

/**
 * 主壳：桌面端侧栏面板 + 主内容，窄屏顶栏 + 侧栏 Drawer。
 * 应用端与管理端布局都基于它构建，折叠态 rail、窄屏行为与主内容框架由壳统一提供，
 * 两端的差异只在侧栏内容、导航项、aria 文案和窄屏标题。
 */
function MainShell({
  panelGroupId,
  sidebarAriaLabel,
  mainMinWidth,
  mainContentScroll = false,
  renderSidebar,
  railContent,
  renderDrawerSidebar,
  mobileHeaderTitle,
  children,
}: MainShellProps) {
  const { t } = useTranslation('shell');
  const { colorScheme } = useColorScheme();
  const desktopWindow = useDesktopWindowState();
  const location = useLocation();
  const { breakpointVersion, isMobileLayout } = useMainShellMobileSnapshot();
  const sidebar = useSystemSidebarPanel({
    collapsedWidth: MAIN_SIDEBAR_RAIL_WIDTH,
    enabled: !isMobileLayout,
    panelGroupId,
  });
  const [drawerOpenState, setDrawerOpenState] = useState<DrawerOpenState | null>(null);
  const drawerOpen =
    isMobileLayout &&
    drawerOpenState?.routeKey === location.key &&
    drawerOpenState.breakpointVersion === breakpointVersion;

  const setDrawerOpen = (open: boolean) => {
    setDrawerOpenState(open ? { breakpointVersion, routeKey: location.key } : null);
  };

  const toggleSidebar = () => {
    if (isMobileLayout) {
      setDrawerOpenState((openState) =>
        openState?.routeKey === location.key && openState.breakpointVersion === breakpointVersion
          ? null
          : { breakpointVersion, routeKey: location.key }
      );
      return;
    }
    sidebar.toggle();
  };

  const mainShellContext = {
    sidebarCollapsed: sidebar.collapsed,
    isMobileLayout,
    onToggleSidebar: toggleSidebar,
  } satisfies MainShellContextValue;

  const renderCollapsedRail = () => (
    <aside className={styles.rail} aria-label={sidebarAriaLabel}>
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
          onPress={toggleSidebar}
          tooltip={{ placement: 'right' }}
          {...SIDEBAR_TOGGLE_BUTTON_PROPS}
        />
      </div>
      {railContent}
    </aside>
  );

  const mainColumn = (
    <div
      className={cn(
        styles.mainColumn,
        desktopWindow.hasTitleBarInset &&
          desktopWindow.titleBarInsetSide === 'end' &&
          styles.titleBarInsetEnd
      )}
    >
      {isMobileLayout && mobileHeaderTitle ? (
        <header className={styles.mobileHeader}>
          <AppIconButton
            icon={<Menu size={20} aria-hidden="true" />}
            label={t('navigation.expandSidebar')}
            isActive={drawerOpen}
            onPress={() => setDrawerOpen(true)}
            {...SIDEBAR_TOGGLE_BUTTON_PROPS}
          />
          {mobileHeaderTitle}
        </header>
      ) : null}
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className={cn(styles.mainContent, mainContentScroll && styles.mainContentScroll)}
      >
        {children}
      </main>
    </div>
  );

  return (
    <MainShellContext value={mainShellContext}>
      <div
        className={cn(
          styles.root,
          sidebar.collapsed && styles.rootCollapsed,
          isMobileLayout && styles.rootMobile
        )}
        data-main-sidebar-collapsed={sidebar.collapsed || undefined}
      >
        <SkipToMainLink />
        {isMobileLayout ? (
          <>
            {mainColumn}
            <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
              <Drawer.Backdrop className={styles.drawerBackdrop} isDismissable>
                <Drawer.Content placement="left" className={styles.drawerContent}>
                  <Drawer.Dialog className={styles.drawerDialog} aria-label={sidebarAriaLabel}>
                    <Drawer.Body className={styles.drawerBody}>
                      {renderDrawerSidebar({ onNavigate: () => setDrawerOpen(false) })}
                    </Drawer.Body>
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer>
          </>
        ) : (
          <SystemResizablePanelGroup
            id={panelGroupId}
            orientation="horizontal"
            className={styles.panelGroup}
            resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
            onLayoutChanged={sidebar.handleLayoutChanged}
          >
            <SystemResizablePanel
              id={`${panelGroupId}-sidebar`}
              panelRef={sidebar.panelRef}
              defaultSize={sidebar.panelSize}
              minSize={sidebar.minSize}
              maxSize={sidebar.maxSize}
              groupResizeBehavior="preserve-pixel-size"
              className={styles.sidebarPanel}
              aria-label={sidebarAriaLabel}
              onResize={sidebar.handleResize}
            >
              {sidebar.collapsed
                ? renderCollapsedRail()
                : renderSidebar({ onToggle: toggleSidebar })}
            </SystemResizablePanel>

            <SystemResizableHandle
              collapsed={sidebar.collapsed}
              disabled={sidebar.collapsed}
              aria-label={t('navigation.resizeSidebar')}
            />

            <SystemResizablePanel
              id={`${panelGroupId}-main`}
              minSize={mainMinWidth}
              className={styles.mainColumnPanel}
            >
              {mainColumn}
            </SystemResizablePanel>
          </SystemResizablePanelGroup>
        )}
      </div>
    </MainShellContext>
  );
}

export default MainShell;
