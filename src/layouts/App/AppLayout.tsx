import {
  APP_MAIN_MIN_WIDTH,
  APP_WEB_SIDEBAR_COLLAPSED_WIDTH,
  LAYOUT_DENSITY,
  resolveLayoutDensity,
} from '@/constants/layoutScale';
import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import { useSystemLayoutStore } from '@/layouts/_common/_store/useSystemLayoutStore';
import AppSidebar from '@/layouts/_common/Sidebar/AppSidebar';
import {
  clampSidebarWidth,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from '@/layouts/_common/Sidebar/sidebarLayoutConfig';
import {
  SystemResizableHandle,
  SystemResizablePanel,
  SystemResizablePanelGroup,
} from '@/layouts/_common/SystemResizable';
import { useCompactSidebarCollapse } from '@/layouts/_common/useCompactSidebarCollapse';
import { useResizablePanelSize } from '@/layouts/_common/useResizablePanelSize';
import {
  SIDEBAR_COLLAPSE_DURATION_MS,
  useSidebarCollapseMotion,
} from '@/layouts/_common/useSidebarCollapseMotion';
import { useAppNavigation } from '@/layouts/AppNavigation/AppNavigationContext';
import AppNavigationControls from '@/layouts/AppNavigation/AppNavigationControls';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Layout,
  LayoutChangedMeta,
  PanelImperativeHandle,
  PanelSize,
} from 'react-resizable-panels';
import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.less';

function AppLayout() {
  const { t } = useTranslation('shell');
  const appNavigation = useAppNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      resolveLayoutDensity(window.innerWidth) === LAYOUT_DENSITY.COMPACT
  );
  const storedSidebarWidth = useSystemLayoutStore((state) => state.appSidebarWidth);
  const setSidebarWidth = useSystemLayoutStore((state) => state.setAppSidebarWidth);
  const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
  const pendingSidebarWidthRef = useRef<number | null>(null);
  const sidebarWidth = clampSidebarWidth(storedSidebarWidth);
  const desktopWindow = useDesktopWindowState();
  const collapsedSidebarWidth = desktopWindow.isDesktop
    ? SIDEBAR_COLLAPSED_WIDTH
    : APP_WEB_SIDEBAR_COLLAPSED_WIDTH;
  const {
    panelSize: sidebarPanelSize,
    minSize: sidebarMinSize,
    maxSize: sidebarMaxSize,
    showSidebarContent,
    showCollapsedChrome,
  } = useSidebarCollapseMotion({
    collapsed: sidebarCollapsed,
    expandedWidth: sidebarWidth,
    collapsedWidth: collapsedSidebarWidth,
  });

  const persistSidebarWidthFromPanel = () => {
    const currentWidth = sidebarPanelRef.current?.getSize().inPixels;
    if (currentWidth == null) return;
    const nextSidebarWidth = clampSidebarWidth(currentWidth);
    if (nextSidebarWidth > SIDEBAR_MIN_WIDTH || sidebarWidth === SIDEBAR_MIN_WIDTH) {
      setSidebarWidth(nextSidebarWidth);
    }
  };

  const { density, markSidebarUserOverride } = useCompactSidebarCollapse({
    sidebarCollapsed,
    setSidebarCollapsed,
    onAutoCollapse: persistSidebarWidthFromPanel,
  });

  useResizablePanelSize({
    panelRef: sidebarPanelRef,
    size: sidebarPanelSize,
    animate: true,
    durationMs: SIDEBAR_COLLAPSE_DURATION_MS,
  });

  const handleSidebarToggle = () => {
    markSidebarUserOverride();
    setSidebarCollapsed((collapsed) => {
      if (!collapsed) {
        persistSidebarWidthFromPanel();
      }
      return !collapsed;
    });
  };

  const handleSidebarResize = (panelSize: PanelSize) => {
    if (sidebarCollapsed) return;
    pendingSidebarWidthRef.current = clampSidebarWidth(panelSize.inPixels);
  };

  const handleLayoutChanged = (_layout: Layout, meta: LayoutChangedMeta) => {
    const pendingSidebarWidth = pendingSidebarWidthRef.current;
    pendingSidebarWidthRef.current = null;
    if (sidebarCollapsed || !meta.isUserInteraction || pendingSidebarWidth == null) return;
    setSidebarWidth(pendingSidebarWidth);
  };

  return (
    <div className={styles.root} data-layout-density={density}>
      <SystemResizablePanelGroup
        orientation="horizontal"
        className={styles.panelGroup}
        onLayoutChanged={handleLayoutChanged}
      >
        <SystemResizablePanel
          id="app-sidebar"
          panelRef={sidebarPanelRef}
          defaultSize={sidebarPanelSize}
          /* min=0 允许收起/展开插值；展开态下限由 clampSidebarWidth 在拖拽落定后保证 */
          minSize={sidebarMinSize}
          maxSize={sidebarMaxSize}
          groupResizeBehavior="preserve-pixel-size"
          className={clsx(
            styles.leftSider,
            sidebarCollapsed && !desktopWindow.isDesktop && styles.webCollapsedSider
          )}
          aria-label={t('navigation.appSidebar')}
          aria-hidden={sidebarCollapsed && desktopWindow.isDesktop ? true : undefined}
          onResize={handleSidebarResize}
        >
          {showCollapsedChrome && !desktopWindow.isDesktop ? (
            <header className={styles.webCollapsedSidebar}>
              <AppNavigationControls
                sidebarCollapsed
                showHistory={false}
                canGoBack={appNavigation.canGoBack}
                canGoForward={appNavigation.canGoForward}
                onGoBack={appNavigation.goBack}
                onGoForward={appNavigation.goForward}
                onToggleSidebar={handleSidebarToggle}
              />
            </header>
          ) : null}
          {showSidebarContent ? (
            <AppSidebar
              canGoBack={appNavigation.canGoBack}
              canGoForward={appNavigation.canGoForward}
              onGoBack={appNavigation.goBack}
              onGoForward={appNavigation.goForward}
              onToggle={handleSidebarToggle}
            />
          ) : null}
        </SystemResizablePanel>

        <SystemResizableHandle
          className={clsx(styles.resizeHandle, sidebarCollapsed && styles.resizeHandleCollapsed)}
          disabled={sidebarCollapsed}
        />

        <SystemResizablePanel
          id="app-main"
          minSize={APP_MAIN_MIN_WIDTH}
          className={styles.middleLayout}
        >
          {desktopWindow.isDesktop ? (
            <header
              className={clsx(
                styles.desktopHeader,
                desktopWindow.hasMacTitleBarInset && styles.macDesktopHeader
              )}
            >
              {showCollapsedChrome ? (
                <div className={styles.collapsedHeaderControls}>
                  <AppNavigationControls
                    sidebarCollapsed
                    showHistory={desktopWindow.isDesktop}
                    canGoBack={appNavigation.canGoBack}
                    canGoForward={appNavigation.canGoForward}
                    onGoBack={appNavigation.goBack}
                    onGoForward={appNavigation.goForward}
                    onToggleSidebar={handleSidebarToggle}
                  />
                </div>
              ) : null}
            </header>
          ) : null}
          <main className={styles.middleContent}>
            <Outlet />
          </main>
        </SystemResizablePanel>
      </SystemResizablePanelGroup>
    </div>
  );
}

export default AppLayout;
