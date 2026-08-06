import { SIDEBAR_MAX_WIDTH } from '@/layouts/_common/Sidebar/sidebarLayoutConfig';
import { useEffect, useRef, useState } from 'react';

/** 侧栏开合时长：短促跟手，避免拖泥带水 */
export const SIDEBAR_COLLAPSE_DURATION_MS = 200;

interface UseSidebarCollapseMotionOptions {
  collapsed: boolean;
  expandedWidth: number;
  collapsedWidth: number;
  maxSize?: number;
}

interface SidebarCollapseMotion {
  panelSize: number;
  minSize: number;
  maxSize: number;
  /** 收起动画结束后再显示窄轨/顶栏控件 */
  showCollapsedChrome: boolean;
  isAnimating: boolean;
  /** 宽度插值完成时调用，与 rAF 对齐后再清动效标记 */
  notifyAnimationComplete: () => void;
}

/**
 * 侧栏收起/展开：放宽 Panel 约束并标记动效期。内容常挂载，由布局侧做 clip-slide。
 * 动效结束由 useResizablePanelSize 的 onComplete 驱动，避免 setTimeout 与 rAF 错位顿挫。
 */
export function useSidebarCollapseMotion({
  collapsed,
  expandedWidth,
  collapsedWidth,
  maxSize = SIDEBAR_MAX_WIDTH,
}: UseSidebarCollapseMotionOptions): SidebarCollapseMotion {
  const [isAnimating, setIsAnimating] = useState(false);
  const [collapsedSnapshot, setCollapsedSnapshot] = useState(collapsed);
  const collapsedRef = useRef(collapsed);
  const collapsedWidthRef = useRef(collapsedWidth);

  /**
   * @wisepen-manual-effect
   * 执行时机：collapsed / collapsedWidth 变化后同步到 ref，供动画完成回调读取。
   * 不可替代原因：完成回调在 rAF 中触发，不能把最新折叠态放进该回调依赖。
   * cleanup：无。
   */
  useEffect(() => {
    collapsedRef.current = collapsed;
    collapsedWidthRef.current = collapsedWidth;
  }, [collapsed, collapsedWidth]);

  let animating = isAnimating;
  if (collapsedSnapshot !== collapsed) {
    setCollapsedSnapshot(collapsed);
    setIsAnimating(true);
    animating = true;
  }

  return {
    panelSize: collapsed ? collapsedWidth : expandedWidth,
    minSize: 0,
    maxSize,
    showCollapsedChrome: collapsed && !animating,
    isAnimating: animating,
    notifyAnimationComplete: () => {
      setIsAnimating((was) => {
        if (!was) return false;
        /*
         * 收到 0 宽时锚点仍由 collapsed 维持，收起结束若再 setState
         * 会逼整页重渲，表现为末帧卡顿；保持 true 让 React bail out。
         */
        if (collapsedRef.current && collapsedWidthRef.current === 0) {
          return true;
        }
        return false;
      });
    },
  };
}
