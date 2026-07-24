import {
  LAYOUT_DENSITY,
  LAYOUT_HEIGHT_DENSITY,
  resolveLayoutDensity,
  resolveLayoutHeightDensity,
  type LayoutDensity,
  type LayoutHeightDensity,
} from '@/constants/layoutScale';
import { useEffectForce } from '@/hooks/useEffectForce';
import { syncViewportLayoutScale } from '@/layouts/_common/applyLayoutScaleCssVars';
import { useState } from 'react';

interface ViewportLayoutScale {
  widthDensity: LayoutDensity;
  heightDensity: LayoutHeightDensity;
}

/**
 * 将视口宽高密度同步到 documentElement（data-layout-* + CSS 变量）。
 */
export const useViewportLayoutScale = (): ViewportLayoutScale => {
  const [scale, setScale] = useState<ViewportLayoutScale>(() => {
    if (typeof window === 'undefined') {
      return {
        widthDensity: LAYOUT_DENSITY.NORMAL,
        heightDensity: LAYOUT_HEIGHT_DENSITY.NORMAL,
      };
    }
    return {
      widthDensity: resolveLayoutDensity(window.innerWidth),
      heightDensity: resolveLayoutHeightDensity(window.innerHeight),
    };
  });

  useEffectForce(() => {
    const sync = () => {
      const next = syncViewportLayoutScale();
      setScale((prev) =>
        prev.widthDensity === next.widthDensity && prev.heightDensity === next.heightDensity
          ? prev
          : next
      );
    };

    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  return scale;
};
