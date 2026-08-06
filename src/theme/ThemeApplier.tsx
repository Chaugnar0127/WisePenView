import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { DEFAULT_COLOR_SCHEME, DEFAULT_HEROUI_THEME } from './constants';
import { ThemeContextProvider } from './ThemeContext';
import { applyColorSchemeFavicon, applyColorSchemeToDOM, useColorScheme } from './useColorScheme';
import { useThemeShape } from './useThemeShape';

type ThemeApplierProps = {
  children: ReactNode;
  defaultTheme?: string;
};

/** 根节点同步明暗与配色到 documentElement */
export function ThemeApplier({ children, defaultTheme = DEFAULT_HEROUI_THEME }: ThemeApplierProps) {
  return (
    <ThemeContextProvider defaultTheme={defaultTheme}>
      <ThemeShapeApplier>{children}</ThemeShapeApplier>
    </ThemeContextProvider>
  );
}

function ThemeShapeApplier({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme(DEFAULT_COLOR_SCHEME);
  useThemeShape();

  /**
   * @wisepen-manual-effect
   * 执行时机：主题色变化后，同步 document、favicon 和 Electron 外壳图标。
   * 不可替代原因：这些都属于 React 外部状态，且只应由根节点统一驱动一次。
   * cleanup：无；这里只做同步写入，不注册监听器。
   */
  useEffect(() => {
    applyColorSchemeToDOM(colorScheme);
    applyColorSchemeFavicon(colorScheme);
    void window.desktop?.setColorScheme?.(colorScheme);
  }, [colorScheme]);

  return <>{children}</>;
}
