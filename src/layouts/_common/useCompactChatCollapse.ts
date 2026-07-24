import { LAYOUT_DENSITY, type LayoutDensity } from '@/constants/layoutScale';
import { useEffectForce } from '@/hooks/useEffectForce';
import { useCallback, useRef } from 'react';

interface UseCompactChatCollapseOptions {
  density: LayoutDensity;
  /** 当前是否有可展示的 Chat */
  shouldRenderChatPanel: boolean;
  chatPanelCollapsed: boolean;
  setChatPanelCollapsed: (collapsed: boolean) => void;
}

interface UseCompactChatCollapseResult {
  /** 用户手动唤出/收起 Chat 时调用，避免密度逻辑立刻再次收起或误展开 */
  markChatUserOverride: () => void;
}

/**
 * 跟随宽屏密度：进入 compact 自动收起 Chat
 */
export const useCompactChatCollapse = ({
  density,
  shouldRenderChatPanel,
  chatPanelCollapsed,
  setChatPanelCollapsed,
}: UseCompactChatCollapseOptions): UseCompactChatCollapseResult => {
  const collapsedByDensityRef = useRef(density === LAYOUT_DENSITY.COMPACT);
  const prevDensityRef = useRef(density);

  useEffectForce(() => {
    const prevDensity = prevDensityRef.current;
    if (prevDensity === density) return;
    prevDensityRef.current = density;

    if (density === LAYOUT_DENSITY.COMPACT) {
      collapsedByDensityRef.current = true;
      if (shouldRenderChatPanel && !chatPanelCollapsed) {
        setChatPanelCollapsed(true);
      }
      return;
    }

    if (collapsedByDensityRef.current && shouldRenderChatPanel) {
      collapsedByDensityRef.current = false;
      setChatPanelCollapsed(false);
    }
  }, [chatPanelCollapsed, density, setChatPanelCollapsed, shouldRenderChatPanel]);

  const markChatUserOverride = useCallback(() => {
    collapsedByDensityRef.current = false;
  }, []);

  return { markChatUserOverride };
};
