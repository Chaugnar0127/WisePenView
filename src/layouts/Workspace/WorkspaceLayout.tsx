import ChatPanel from '@/components/ChatPanel';
import { useChatPanelStore } from '@/components/ChatPanel/_store/useChatPanelStore';
import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import { clearNewChatSessionStore } from '@/components/ChatPanel/_store/useNewChatSessionStore';
import { createResourceChatStateProvider } from '@/components/ChatPanel/ResourceChatProtocol';
import {
  CHAT_PANEL_MIN_WIDTH,
  clampWorkspaceChatPanelWidth,
  LAYOUT_DENSITY,
  MAIN_MIN_WIDTH,
  MAIN_SCROLL_MIN_WIDTH,
  NOTE_EDITOR_MIN_WIDTH,
  NOTE_WITH_SIDE_PANEL_MIN_WIDTH,
  resolveLayoutDensity,
  WORKSPACE_CHAT_PANEL_MAX_WIDTH,
} from '@/constants/layoutScale';
import { useOpenInWorkspace } from '@/hooks/useOpenInWorkspace';
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
import { normalizeResourceKind, resolveResourceViewer } from '@/utils/navigation/resourceTarget';
import WorkspaceResourceSidePanelActions from '@/views/workspace/_components/WorkspaceResourceSidePanel/Actions';
import { useWorkspaceResourceSidePanelStore } from '@/views/workspace/_store/useWorkspaceResourceSidePanelStore';
import {
  DEFAULT_RESOURCE_HOST_ID,
  ResourceHostContext,
  type ResourceHostContextValue,
  type ResourceHostLayoutConfig,
} from '@/views/workspace/ResourceHostContext';
import clsx from 'clsx';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Layout,
  LayoutChangedMeta,
  PanelImperativeHandle,
  PanelSize,
} from 'react-resizable-panels';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import WorkspaceFrame from './_common/WorkspaceFrame';
import WorkspaceHeader from './_common/WorkspaceHeader';
import { useWorkspaceChatProtocolStore } from './_store/useWorkspaceChatProtocolStore';
import { useWorkspaceNavigationStore } from './_store/useWorkspaceNavigationStore';
import { useWorkspaceHeaderEndReserve } from './useWorkspaceHeaderEndReserve';
import { useWorkspaceResourceBreadcrumb } from './useWorkspaceResourceBreadcrumb';
import styles from './WorkspaceLayout.module.less';

const RESIZE_TARGET_MINIMUM_SIZE = { fine: 16, coarse: 32 };

function WorkspaceLayout() {
  const { t } = useTranslation('workspace');
  const appNavigation = useAppNavigation();
  const openResource = useOpenInWorkspace();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      resolveLayoutDensity(window.innerWidth) === LAYOUT_DENSITY.COMPACT
  );
  const [layoutConfig, setLayoutConfigState] = useState<ResourceHostLayoutConfig>({});
  const storedLeftSidebarWidth = useSystemLayoutStore((state) => state.appSidebarWidth);
  const setLeftSidebarWidth = useSystemLayoutStore((state) => state.setAppSidebarWidth);
  const leftSidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
  const rightDockPanelRef = useRef<PanelImperativeHandle | null>(null);
  const pendingLeftSidebarWidthRef = useRef<number | null>(null);
  const pendingRightDockWidthRef = useRef<number | null>(null);
  const leftSidebarWidth = clampSidebarWidth(storedLeftSidebarWidth);
  const chatPanelCollapsed = useChatPanelStore((state) => state.chatPanelCollapsed);
  const chatPanelDraftOpen = useChatPanelStore((state) => state.chatPanelDraftOpen);
  const chatPanelWidth = useChatPanelStore((state) => state.chatPanelWidth);
  const setChatPanelCollapsed = useChatPanelStore((state) => state.setChatPanelCollapsed);
  const setChatPanelDraftOpen = useChatPanelStore((state) => state.setChatPanelDraftOpen);
  const setChatPanelWidth = useChatPanelStore((state) => state.setChatPanelWidth);
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const clearCurrentSession = useCurrentChatSessionStore((state) => state.clearCurrentSession);
  const workspaceChatContext = useWorkspaceChatProtocolStore((state) => state.context);
  const clearWorkspaceChatContext = useWorkspaceChatProtocolStore((state) => state.clearContext);
  const hasSessionId = Boolean(currentSessionId);
  const shouldRenderChatPanel = hasSessionId || chatPanelDraftOpen;
  const safeChatPanelCollapsed = !shouldRenderChatPanel || chatPanelCollapsed;
  const chatPanelOpen = !safeChatPanelCollapsed;
  const normalizedChatPanelWidth = clampWorkspaceChatPanelWidth(chatPanelWidth);
  const {
    panelSize: sidebarPanelSize,
    minSize: sidebarMinSize,
    maxSize: sidebarMaxSize,
    isAnimating: isSidebarAnimating,
  } = useSidebarCollapseMotion({
    collapsed: sidebarCollapsed,
    expandedWidth: leftSidebarWidth,
    collapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
  });
  const anchorSidebarSlide = isSidebarAnimating || sidebarCollapsed;
  const {
    panelSize: rightDockPanelSize,
    maxSize: rightDockMaxSize,
    isAnimating: isChatPanelAnimating,
  } = useSidebarCollapseMotion({
    collapsed: !chatPanelOpen,
    expandedWidth: normalizedChatPanelWidth,
    collapsedWidth: 0,
    maxSize: WORKSPACE_CHAT_PANEL_MAX_WIDTH,
  });
  /** 收起瞬间冻结内容宽度，避免小于最小宽时内部排版被压扁 */
  const [chatOpenSnapshot, setChatOpenSnapshot] = useState(chatPanelOpen);
  const [frozenChatSlideWidthPx, setFrozenChatSlideWidthPx] = useState(normalizedChatPanelWidth);
  const isChatClosing = chatOpenSnapshot && !chatPanelOpen;
  if (chatOpenSnapshot !== chatPanelOpen) {
    setChatOpenSnapshot(chatPanelOpen);
    if (!chatPanelOpen) {
      setFrozenChatSlideWidthPx(normalizedChatPanelWidth);
    }
  }
  const chatSlideWidthPx = chatPanelOpen
    ? normalizedChatPanelWidth
    : isChatClosing
      ? normalizedChatPanelWidth
      : frozenChatSlideWidthPx;
  /**
   * 展开一开始就抬布局下限，避免动画结束时 workspaceInnerGroup min-width 突然生效造成顿挫；
   * 收起过程中保持约束，直到动画结束再放开。
   */
  const applyChatOpenLayoutConstraints = chatPanelOpen || isChatPanelAnimating;
  const { headerRef: workspaceHeaderRef, onDockWidthPixels } = useWorkspaceHeaderEndReserve({
    idleDockWidthPx: chatPanelOpen ? normalizedChatPanelWidth : 0,
    isAnimating: isChatPanelAnimating,
  });
  const location = useLocation();
  const resourceRouteParams = useParams<{ resourceType?: string; resourceId?: string }>();
  const routeContext = (() => {
    const rawResourceType = resourceRouteParams.resourceType;
    const resourceId = resourceRouteParams.resourceId;
    const resourceType = normalizeResourceKind(rawResourceType);
    const viewer = resolveResourceViewer({
      resourceType: rawResourceType,
      viewer: new URLSearchParams(location.search).get('viewer') ?? undefined,
    });

    return {
      resourceId,
      resourceType,
      viewer,
    };
  })();
  const routeChatStateProvider = (() => {
    const { resourceId, resourceType, viewer } = routeContext;
    if (!resourceId || !resourceType) return undefined;
    return createResourceChatStateProvider({
      resourceId,
      resourceType,
      viewer,
    });
  })();
  const resourceBreadcrumbItems = useWorkspaceResourceBreadcrumb(routeContext.resourceId);
  const workspaceChatStateProvider = layoutConfig.chatStateProvider ?? routeChatStateProvider;
  const resourceSidePanelOpen = useWorkspaceResourceSidePanelStore((state) => {
    const resourceId = routeContext.resourceId;
    if (!resourceId) return false;
    return (state.modeByResourceId[resourceId] ?? 'closed') !== 'closed';
  });
  const workspaceMainMinWidth = applyChatOpenLayoutConstraints
    ? resourceSidePanelOpen
      ? NOTE_WITH_SIDE_PANEL_MIN_WIDTH
      : NOTE_EDITOR_MIN_WIDTH
    : MAIN_MIN_WIDTH;

  useResizablePanelSize({
    panelRef: leftSidebarPanelRef,
    size: sidebarPanelSize,
    animate: true,
    durationMs: SIDEBAR_COLLAPSE_DURATION_MS,
  });

  useResizablePanelSize({
    panelRef: rightDockPanelRef,
    size: rightDockPanelSize,
    animate: true,
    durationMs: SIDEBAR_COLLAPSE_DURATION_MS,
    /* 与 resize 动画同帧写顶栏留白，不再另开 rAF 轮询 */
    onSizePixels: onDockWidthPixels,
  });

  /**
   * @wisepen-manual-effect
   * 执行时机：会话或聊天草稿消失时收起面板；出现时可展示的 Chat 时展开。
   * 不可替代原因：会话/草稿与折叠状态分属独立 store。
   * cleanup：无。
   */
  useEffect(() => {
    if (!shouldRenderChatPanel) {
      setChatPanelCollapsed(true);
      return;
    }
    setChatPanelCollapsed(false);
  }, [setChatPanelCollapsed, shouldRenderChatPanel]);

  /**
   * @wisepen-manual-effect
   * 执行时机：真实会话建立后关闭仅用于新会话入口的草稿面板标记。
   * 不可替代原因：当前会话与聊天面板状态分属独立 Zustand store。
   * cleanup：没有订阅或延迟任务，无需清理。
   */
  useEffect(() => {
    if (!hasSessionId && !chatPanelDraftOpen) return;
    if (hasSessionId) {
      setChatPanelDraftOpen(false);
    }
  }, [chatPanelDraftOpen, hasSessionId, setChatPanelDraftOpen]);

  const persistLeftSidebarWidthFromPanel = () => {
    const currentWidth = leftSidebarPanelRef.current?.getSize().inPixels;
    if (currentWidth == null) return;
    const nextSidebarWidth = clampSidebarWidth(currentWidth);
    if (nextSidebarWidth > SIDEBAR_MIN_WIDTH || leftSidebarWidth === SIDEBAR_MIN_WIDTH) {
      setLeftSidebarWidth(nextSidebarWidth);
    }
  };

  const { density, markSidebarUserOverride } = useCompactSidebarCollapse({
    sidebarCollapsed,
    setSidebarCollapsed,
    onAutoCollapse: persistLeftSidebarWidthFromPanel,
  });

  /**
   * @wisepen-manual-effect
   * 执行时机：资源页向工作区 Chat 发布上下文后，展开面板。
   * 不可替代原因：资源上下文与聊天面板分属独立 store。
   * cleanup：无。
   */
  useEffect(() => {
    if (!workspaceChatContext) return;
    if (!hasSessionId) {
      setChatPanelDraftOpen(true);
    }
    setChatPanelCollapsed(false);
  }, [hasSessionId, setChatPanelCollapsed, setChatPanelDraftOpen, workspaceChatContext]);

  const handleSidebarToggle = () => {
    markSidebarUserOverride();
    setSidebarCollapsed((collapsed) => {
      if (!collapsed) {
        persistLeftSidebarWidthFromPanel();
      }
      return !collapsed;
    });
  };

  const handleChatPanelToggle = () => {
    if (safeChatPanelCollapsed) {
      if (!hasSessionId) {
        setChatPanelDraftOpen(true);
      }
      setChatPanelCollapsed(false);
      return;
    }

    setChatPanelCollapsed(true);
    if (!hasSessionId) {
      setChatPanelDraftOpen(false);
    }
  };

  const handleNewChat = () => {
    clearCurrentSession();
    clearNewChatSessionStore();
    setChatPanelDraftOpen(true);
    setChatPanelCollapsed(false);
  };

  const handleLeftSidebarResize = (panelSize: PanelSize) => {
    if (sidebarCollapsed) return;
    pendingLeftSidebarWidthRef.current = clampSidebarWidth(panelSize.inPixels);
  };

  const handleRightDockResize = (panelSize: PanelSize) => {
    onDockWidthPixels(panelSize.inPixels);
    if (!chatPanelOpen) return;
    pendingRightDockWidthRef.current = clampWorkspaceChatPanelWidth(panelSize.inPixels);
  };

  const handleWorkspaceShellLayoutChanged = (_layout: Layout, meta: LayoutChangedMeta) => {
    const pendingLeftSidebarWidth = pendingLeftSidebarWidthRef.current;
    pendingLeftSidebarWidthRef.current = null;
    if (!meta.isUserInteraction) return;
    if (!sidebarCollapsed && pendingLeftSidebarWidth != null) {
      setLeftSidebarWidth(pendingLeftSidebarWidth);
    }
  };

  const handleWorkspaceContentLayoutChanged = (_layout: Layout, meta: LayoutChangedMeta) => {
    const pendingRightDockWidth = pendingRightDockWidthRef.current;
    pendingRightDockWidthRef.current = null;
    if (!meta.isUserInteraction) return;
    if (chatPanelOpen && pendingRightDockWidth != null) {
      setChatPanelWidth(pendingRightDockWidth);
    }
  };

  const resetLayoutConfig = () => {
    setLayoutConfigState({});
  };

  const resourceHostContext = {
    hostId: DEFAULT_RESOURCE_HOST_ID,
    layoutConfig,
    routeContext,
    getNavigationScope: () => useWorkspaceNavigationStore.getState().location.scope,
    openResource,
    setLayoutConfig: setLayoutConfigState,
    resetLayoutConfig,
    setChatContext: useWorkspaceChatProtocolStore.getState().setContext,
    clearChatContext: useWorkspaceChatProtocolStore.getState().clearContext,
  } satisfies ResourceHostContextValue;

  const renderHeader = () => {
    if (layoutConfig.header === false) return null;

    const headerConfig = layoutConfig.header ?? {};
    const sidePanelConfig =
      layoutConfig.sidePanel?.resource.resourceId === routeContext.resourceId
        ? layoutConfig.sidePanel
        : undefined;
    const resource = headerConfig.resource
      ? {
          ...headerConfig.resource,
          breadcrumbItems: resourceBreadcrumbItems,
          chatPanelCollapsed: safeChatPanelCollapsed,
          onToggleChatPanel: handleChatPanelToggle,
        }
      : undefined;

    return (
      <WorkspaceHeader
        {...headerConfig}
        resource={resource}
        resourceSidePanelActions={
          sidePanelConfig ? (
            <WorkspaceResourceSidePanelActions
              resourceId={sidePanelConfig.resource.resourceId}
              inlineCommentAvailable={Boolean(sidePanelConfig.inlineComment)}
              disabled={headerConfig.resource?.isDisabled}
            />
          ) : undefined
        }
        canGoBack={appNavigation.canGoBack}
        canGoForward={appNavigation.canGoForward}
        leftSidebarCollapsed={sidebarCollapsed}
        headerRef={workspaceHeaderRef}
        onGoBack={appNavigation.goBack}
        onGoForward={appNavigation.goForward}
        onToggleLeftSidebar={handleSidebarToggle}
        // Zen Mode 暂不上线，暂不向 Header 提供入口。
        // onEnterZenMode={handleEnterZenMode}
      />
    );
  };

  return (
    <SystemResizablePanelGroup
      orientation="horizontal"
      className={styles.root}
      data-layout-density={density}
      resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
      onLayoutChanged={handleWorkspaceShellLayoutChanged}
    >
      <SystemResizablePanel
        id="workspace-left-sidebar"
        panelRef={leftSidebarPanelRef}
        defaultSize={sidebarPanelSize}
        /* min=0 允许收起/展开插值；展开态下限由 clampSidebarWidth 在拖拽落定后保证 */
        minSize={sidebarMinSize}
        maxSize={sidebarMaxSize}
        groupResizeBehavior="preserve-pixel-size"
        className={styles.leftSider}
        aria-label={t('shell.appSidebar')}
        aria-hidden={sidebarCollapsed ? true : undefined}
        onResize={handleLeftSidebarResize}
      >
        <div className={styles.sidebarSlideHost}>
          <div
            className={clsx(
              styles.sidebarSlideFrame,
              anchorSidebarSlide && styles.sidebarSlideFrameAnchored
            )}
            style={
              anchorSidebarSlide
                ? ({
                    '--sidebar-slide-width': `${leftSidebarWidth}px`,
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
      />

      <SystemResizablePanel
        id="workspace-area"
        /* 外层只占侧栏剩余空间；主区+Chat 的下限由内层 Panel 约束，避免双重叠加撑破 */
        minSize={MAIN_SCROLL_MIN_WIDTH}
        className={styles.workspaceArea}
      >
        <SystemResizablePanelGroup
          orientation="horizontal"
          className={clsx(
            styles.workspaceInnerGroup,
            applyChatOpenLayoutConstraints &&
              (resourceSidePanelOpen
                ? styles.workspaceInnerGroupChatAndSideOpen
                : styles.workspaceInnerGroupChatOpen)
          )}
          resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
          onLayoutChanged={handleWorkspaceContentLayoutChanged}
        >
          <SystemResizablePanel
            id="workspace-main"
            minSize={workspaceMainMinWidth}
            className={styles.middleLayout}
          >
            <main className={`${styles.middleContent} ${styles.workspaceContent}`}>
              <ResourceHostContext value={resourceHostContext}>
                <WorkspaceFrame
                  className={layoutConfig.className}
                  bodyClassName={layoutConfig.bodyClassName}
                  header={renderHeader()}
                >
                  <Outlet />
                </WorkspaceFrame>
              </ResourceHostContext>
            </main>
          </SystemResizablePanel>

          <SystemResizableHandle
            className={clsx(
              styles.resizeHandle,
              !applyChatOpenLayoutConstraints && styles.resizeHandleCollapsed
            )}
            disabled={!applyChatOpenLayoutConstraints}
          />

          <SystemResizablePanel
            id="workspace-right-dock"
            panelRef={rightDockPanelRef}
            defaultSize={rightDockPanelSize}
            /*
             * 动效期间 min=0 才能从 0 插值；静止展开后锁最小宽。
             * 与 isAnimating 同帧切换可能触发布局复核，保持尺寸已到位时再锁。
             */
            minSize={chatPanelOpen && !isChatPanelAnimating ? CHAT_PANEL_MIN_WIDTH : 0}
            maxSize={rightDockMaxSize}
            groupResizeBehavior="preserve-pixel-size"
            className={styles.rightSider}
            aria-label={t('shell.chatPanel')}
            aria-hidden={!chatPanelOpen ? true : undefined}
            onResize={handleRightDockResize}
          >
            {shouldRenderChatPanel ? (
              <div className={styles.chatPanelSlideHost}>
                <div
                  className={clsx(
                    styles.chatPanelSlideFrame,
                    isChatPanelAnimating && styles.chatPanelSlideFrameAnchored
                  )}
                  style={
                    isChatPanelAnimating
                      ? ({
                          '--chat-panel-slide-width': `${chatSlideWidthPx}px`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <ChatPanel
                    showCollapseButton={false}
                    onNewChat={handleNewChat}
                    resourceChat={{
                      provider: workspaceChatStateProvider,
                      context: workspaceChatContext,
                      clearContext: clearWorkspaceChatContext,
                    }}
                    agentDebug={layoutConfig.chatAgentDebug}
                  />
                </div>
              </div>
            ) : null}
          </SystemResizablePanel>
        </SystemResizablePanelGroup>
      </SystemResizablePanel>
    </SystemResizablePanelGroup>
  );
}

export default WorkspaceLayout;
