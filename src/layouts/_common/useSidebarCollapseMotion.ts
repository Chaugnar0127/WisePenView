import { SIDEBAR_MAX_WIDTH } from '@/layouts/_common/Sidebar/sidebarLayoutConfig';
import { useEffect, useState } from 'react';

/** 与 useResizablePanelSize 默认时长对齐，便于内容延迟卸载 */
export const SIDEBAR_COLLAPSE_DURATION_MS = 300;

interface UseSidebarCollapseMotionOptions {
  collapsed: boolean;
  expandedWidth: number;
  collapsedWidth: number;
  /** 动画期间 Panel 上限；默认侧栏 SIDEBAR_MAX_WIDTH */
  maxSize?: number;
  durationMs?: number;
}

interface SidebarCollapseMotion {
  panelSize: number;
  /** 始终放宽，才能在收起/展开过程中插值；展开下限由拖拽落定后的 clamp 保证 */
  minSize: number;
  maxSize: number;
  /** 动画期间保持侧栏内容挂载，避免宽度在动、DOM 已卸的断层 */
  showSidebarContent: boolean;
  /** 收起动画结束后再显示窄轨/顶栏控件，避免与侧栏内容叠闪 */
  showCollapsedChrome: boolean;
  /** 收起/展开宽度动画进行中 */
  isAnimating: boolean;
}

/**
 * 侧栏收起/展开动效：放宽 Panel 尺寸约束，并延迟切换折叠态 chrome。
 */
export function useSidebarCollapseMotion({
  collapsed,
  expandedWidth,
  collapsedWidth,
  maxSize = SIDEBAR_MAX_WIDTH,
  durationMs = SIDEBAR_COLLAPSE_DURATION_MS,
}: UseSidebarCollapseMotionOptions): SidebarCollapseMotion {
  const [showSidebarContent, setShowSidebarContent] = useState(() => !collapsed);
  const [isAnimating, setIsAnimating] = useState(false);
  const [collapsedSnapshot, setCollapsedSnapshot] = useState(collapsed);

  /**
   * 折叠态翻转时同步进入动效（不能等 useEffect，否则展开首帧 minSize 会先被夹死）。
   * 展开立即挂载内容；收起内容延迟到动画结束后再卸。
   */
  if (collapsedSnapshot !== collapsed) {
    setCollapsedSnapshot(collapsed);
    setIsAnimating(true);
    if (!collapsed) {
      setShowSidebarContent(true);
    }
  }

  /**
   * @wisepen-manual-effect
   * 执行时机：折叠态变化时，在宽度动画结束后复位动效标记；收起则再卸载内容。
   * 不可替代原因：挂载时机依赖动画时长，不属于派生渲染。
   * cleanup：取消未完成的延迟卸载与动效标记复位。
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (collapsed) {
        setShowSidebarContent(false);
      }
      setIsAnimating(false);
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [collapsed, durationMs]);

  return {
    panelSize: collapsed ? collapsedWidth : expandedWidth,
    minSize: 0,
    maxSize,
    showSidebarContent,
    showCollapsedChrome: collapsed && !showSidebarContent,
    isAnimating,
  };
}
