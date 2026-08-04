import { SIDEBAR_MAX_WIDTH } from '@/layouts/_common/Sidebar/sidebarLayoutConfig';
import { useEffect, useState } from 'react';

/** 侧栏开合时长：短促跟手，避免拖泥带水 */
export const SIDEBAR_COLLAPSE_DURATION_MS = 200;

interface UseSidebarCollapseMotionOptions {
  collapsed: boolean;
  expandedWidth: number;
  collapsedWidth: number;
  maxSize?: number;
  durationMs?: number;
}

interface SidebarCollapseMotion {
  panelSize: number;
  minSize: number;
  maxSize: number;
  /** 收起动画结束后再显示窄轨/顶栏控件 */
  showCollapsedChrome: boolean;
  isAnimating: boolean;
}

/**
 * 侧栏收起/展开：放宽 Panel 约束并标记动效期。内容常挂载，由布局侧做 clip-slide。
 */
export function useSidebarCollapseMotion({
  collapsed,
  expandedWidth,
  collapsedWidth,
  maxSize = SIDEBAR_MAX_WIDTH,
  durationMs = SIDEBAR_COLLAPSE_DURATION_MS,
}: UseSidebarCollapseMotionOptions): SidebarCollapseMotion {
  const [isAnimating, setIsAnimating] = useState(false);
  const [collapsedSnapshot, setCollapsedSnapshot] = useState(collapsed);

  let animating = isAnimating;
  if (collapsedSnapshot !== collapsed) {
    setCollapsedSnapshot(collapsed);
    setIsAnimating(true);
    animating = true;
  }

  /**
   * @wisepen-manual-effect
   * 执行时机：折叠态变化后，在宽度动画结束时清除动效标记。
   * 不可替代原因：时序依赖 duration，不属于派生渲染。
   * cleanup：取消未完成定时器。
   */
  useEffect(() => {
    const timer = window.setTimeout(() => setIsAnimating(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [collapsed, durationMs]);

  return {
    panelSize: collapsed ? collapsedWidth : expandedWidth,
    minSize: 0,
    maxSize,
    showCollapsedChrome: collapsed && !animating,
    isAnimating: animating,
  };
}
