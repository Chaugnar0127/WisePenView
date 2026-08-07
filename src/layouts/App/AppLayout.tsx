import {
  APP_MAIN_MIN_WIDTH,
  APP_WEB_SIDEBAR_COLLAPSED_WIDTH,
  LAYOUT_DENSITY,
  resolveLayoutDensity,
} from '@/constants/layoutScale';
import { useAppRouteMeta } from '@/hooks/useAppRouteMeta';
import { useDesktopWindowState } from '@/hooks/useDesktopWindowState';
import { useSystemLayoutStore } from '@/layouts/_common/_store/useSystemLayoutStore';
import { focusVisibleSidebarToggle } from '@/layouts/_common/a11y/sidebarToggle';
import SkipToMainLink, { MAIN_CONTENT_ID } from '@/layouts/_common/a11y/SkipToMainLink';
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
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Layout,
  LayoutChangedMeta,
  PanelImperativeHandle,
  PanelSize,
} from 'react-resizable-panels';
import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.less';
import AppResourceShell from './AppResourceShell';

function AppLayout() {
  const { t } = useTranslation('shell');
  const appNavigation = useAppNavigation();
  const routeMeta = useAppRouteMeta();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      resolveLayoutDensity(window.innerWidth) === LAYOUT_DENSITY.COMPACT
  );
  const storedSidebarWidth = useSystemLayoutStore((state) => state.appSidebarWidth);
  const setSidebarWidth = useSystemLayoutStore((state) => state.setAppSidebarWidth);
  const sidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
  const pendingSidebarWidthRef = useRef<number | null>(null);
  const pendingFocusSidebarToggleRef = useRef(false);
  const sidebarWidth = clampSidebarWidth(storedSidebarWidth);
  const desktopWindow = useDesktopWindowState();
  const collapsedSidebarWidth = desktopWindow.isDesktop
    ? SIDEBAR_COLLAPSED_WIDTH
    : APP_WEB_SIDEBAR_COLLAPSED_WIDTH;
  const {
    panelSize: sidebarPanelSize,
    minSize: sidebarMinSize,
    maxSize: sidebarMaxSize,
    showCollapsedChrome: showWebCollapsedChrome,
    isAnimating: isSidebarAnimating,
    notifyAnimationComplete: notifySidebarAnimationComplete,
  } = useSidebarCollapseMotion({
    collapsed: sidebarCollapsed,
    expandedWidth: sidebarWidth,
    collapsedWidth: collapsedSidebarWidth,
  });
  const anchorSidebarSlide = isSidebarAnimating || sidebarCollapsed;
  /* Desktop 收起控件在主顶栏：收起一开始就挂上，避免动画结束再挂载导致末帧卡顿 */
  const showDesktopCollapsedChrome = sidebarCollapsed;
  const isResourceRoute = routeMeta?.pageKey === 'resource';
  const contentContainer = routeMeta?.contentContainer;

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
    onComplete: notifySidebarAnimationComplete,
  });

  /**
   * @wisepen-manual-effect
   * 执行时机：侧栏折叠态或 Web 收起 chrome 就绪后，归还焦点到可见切换按钮。
   * 不可替代原因：Web 收起 chrome 在动画结束后才挂载，不能在 toggle 当时同步 focus。
   * cleanup：无。
   */
  useEffect(() => {
    if (!pendingFocusSidebarToggleRef.current) return;
    if (sidebarCollapsed && !desktopWindow.isDesktop && !showWebCollapsedChrome) return;
    pendingFocusSidebarToggleRef.current = false;
    focusVisibleSidebarToggle();
  }, [sidebarCollapsed, showWebCollapsedChrome, desktopWindow.isDesktop]);

  const handleSidebarToggle = () => {
    pendingFocusSidebarToggleRef.current = true;
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

  const content = isResourceRoute ? (
    <AppResourceShell>
      <Outlet />
    </AppResourceShell>
  ) : (
    <Outlet />
  );

  return (
    <div className={styles.root} data-layout-density={density}>
      <SkipToMainLink />
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
          {showWebCollapsedChrome && !desktopWindow.isDesktop ? (
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
          <div
            className={clsx(
              styles.sidebarSlideHost,
              showWebCollapsedChrome && styles.sidebarSlideHostHidden
            )}
            inert={sidebarCollapsed || undefined}
          >
            <div
              className={clsx(
                styles.sidebarSlideFrame,
                anchorSidebarSlide && styles.sidebarSlideFrameAnchored
              )}
              style={
                anchorSidebarSlide
                  ? ({
                      '--sidebar-slide-width': `${sidebarWidth}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <AppSidebar
                canGoBack={appNavigation.canGoBack}
                canGoForward={appNavigation.canGoForward}
                onGoBack={appNavigation.goBack}
                onGoForward={appNavigation.goForward}
                onToggle={handleSidebarToggle}
              />
            </div>
          </div>
        </SystemResizablePanel>

        <SystemResizableHandle
          className={clsx(styles.resizeHandle, sidebarCollapsed && styles.resizeHandleCollapsed)}
          disabled={sidebarCollapsed}
          aria-label={t('navigation.resizeSidebar')}
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
                desktopWindow.hasTitleBarInset &&
                  desktopWindow.titleBarInsetSide === 'start' &&
                  styles.titleBarInsetStart,
                desktopWindow.hasTitleBarInset &&
                  desktopWindow.titleBarInsetSide === 'end' &&
                  styles.titleBarInsetEnd
              )}
            >
              {showDesktopCollapsedChrome ? (
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
          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className={clsx(
              styles.middleContent,
              isResourceRoute && styles.middleContentResource,
              contentContainer && styles.middleContentContained
            )}
          >
            {contentContainer ? (
              <div
                className={clsx(
                  styles.appPageContainer,
                  contentContainer === 'drive' && styles.appPageContainerDrive
                )}
              >
                {content}
              </div>
            ) : (
              content
            )}
          </main>
        </SystemResizablePanel>
      </SystemResizablePanelGroup>
    </div>
  );
}

export default AppLayout;
