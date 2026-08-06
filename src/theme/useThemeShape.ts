import { useLayoutEffect, useRef, useState } from 'react';

import { DEFAULT_THEME_RADIUS, THEME_RADIUS, type ThemeRadius } from './constants';

const THEME_RADIUS_STORAGE_KEY = 'heroui-theme-radius';
const THEME_FORM_RADIUS_STORAGE_KEY = 'heroui-theme-form-radius';

const THEME_RADIUS_VALUES = new Set<string>(Object.values(THEME_RADIUS));

type ThemeShape = {
  radius: ThemeRadius;
};

function isThemeRadius(value: string): value is ThemeRadius {
  return THEME_RADIUS_VALUES.has(value);
}

function readStoredThemeShape(defaultShape: ThemeShape): ThemeShape {
  if (typeof window === 'undefined') return defaultShape;

  const storedRadius = localStorage.getItem(THEME_RADIUS_STORAGE_KEY);
  localStorage.removeItem(THEME_FORM_RADIUS_STORAGE_KEY);

  if (storedRadius && !isThemeRadius(storedRadius)) {
    localStorage.removeItem(THEME_RADIUS_STORAGE_KEY);
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
    localStorage.setItem(THEME_RADIUS_STORAGE_KEY, radius);
    localStorage.removeItem(THEME_FORM_RADIUS_STORAGE_KEY);
    setThemeShape((prev) => ({ ...prev, radius }));
  };

  return { ...themeShape, setRadius };
}
