import { LAYOUT_DENSITY, resolveLayoutDensity, type LayoutDensity } from '@/constants/layoutScale';
import { useEffectForce } from '@/hooks/useEffectForce';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

interface UseCompactSidebarCollapseOptions {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
  /** 密度自动收起前调用（例如持久化当前侧栏像素宽） */
  onAutoCollapse?: () => void;
}

interface UseCompactSidebarCollapseResult {
  density: LayoutDensity;
  /**
   * 用户手动点切换时调用：
   */
  markSidebarUserOverride: () => void;
}

/**
 * 窄屏（compact）自动收起侧栏
 */
export const useCompactSidebarCollapse = ({
  sidebarCollapsed: _sidebarCollapsed,
  setSidebarCollapsed,
  onAutoCollapse,
}: UseCompactSidebarCollapseOptions): UseCompactSidebarCollapseResult => {
  const [density, setDensity] = useState<LayoutDensity>(() =>
    typeof window === 'undefined' ? LAYOUT_DENSITY.NORMAL : resolveLayoutDensity(window.innerWidth)
  );
  const collapsedByDensityRef = useRef(density === LAYOUT_DENSITY.COMPACT);

  useEffectForce(() => {
    const syncDensity = () => {
      const nextDensity = resolveLayoutDensity(window.innerWidth);

      setDensity((prev) => {
        if (prev === nextDensity) return prev;

        if (nextDensity === LAYOUT_DENSITY.COMPACT) {
          setSidebarCollapsed((collapsed) => {
            if (!collapsed) {
              onAutoCollapse?.();
              collapsedByDensityRef.current = true;
              return true;
            }
            // 已收起：视为由密度接管，宽屏回来时可自动展开
            collapsedByDensityRef.current = true;
            return collapsed;
          });
        } else if (collapsedByDensityRef.current) {
          collapsedByDensityRef.current = false;
          setSidebarCollapsed(false);
        }

        return nextDensity;
      });
    };

    syncDensity();
    window.addEventListener('resize', syncDensity);
    return () => window.removeEventListener('resize', syncDensity);
  }, [onAutoCollapse, setSidebarCollapsed]);

  const markSidebarUserOverride = useCallback(() => {
    collapsedByDensityRef.current = false;
  }, []);

  return {
    density,
    markSidebarUserOverride,
  };
};
