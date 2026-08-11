import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useLayoutEffect, useRef, useState } from 'react';

import { DEFAULT_THEME_RADIUS, THEME_RADIUS, type ThemeRadius } from './constants';

const THEME_RADIUS_VALUES = new Set<string>(Object.values(THEME_RADIUS));

type ThemeShape = {
  radius: ThemeRadius;
};

function isThemeRadius(value: string): value is ThemeRadius {
  return THEME_RADIUS_VALUES.has(value);
}

function readStoredThemeShape(defaultShape: ThemeShape): ThemeShape {
  if (typeof window === 'undefined') return defaultShape;

  const storedRadius = localStorage.getItem(STORAGE_KEYS.themeRadius);
  localStorage.removeItem(STORAGE_KEYS.themeFormRadius);

  if (storedRadius && !isThemeRadius(storedRadius)) {
    localStorage.removeItem(STORAGE_KEYS.themeRadius);
  }

  return {
    radius: storedRadius && isThemeRadius(storedRadius) ? storedRadius : defaultShape.radius,
  };
}

function applyThemeShapeToDOM(shape: ThemeShape, previous: ThemeShape | undefined) {
  if (previous?.radius !== shape.radius) {
    document.documentElement.setAttribute('data-theme-radius', shape.radius);
  }

  document.documentElement.removeAttribute('data-theme-form-radius');
}

/** localStorage 持久化，同时同步 HeroUI 圆角 token 到 documentElement */
export function useThemeShape(
  defaultShape: ThemeShape = {
    radius: DEFAULT_THEME_RADIUS,
  }
) {
  const [themeShape, setThemeShape] = useState<ThemeShape>(() =>
    readStoredThemeShape(defaultShape)
  );
  const appliedRef = useRef<ThemeShape | undefined>(undefined);

  useLayoutEffect(() => {
    applyThemeShapeToDOM(themeShape, appliedRef.current);
    appliedRef.current = themeShape;
  }, [themeShape]);

  const setRadius = (radius: ThemeRadius) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.themeRadius, radius);
    localStorage.removeItem(STORAGE_KEYS.themeFormRadius);
    setThemeShape((prev) => ({ ...prev, radius }));
  };

  return { ...themeShape, setRadius };
}
