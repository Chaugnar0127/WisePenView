import { isDesktop, isMac } from '@/utils/platform';
import { useSyncExternalStore } from 'react';

const subscribe = (listener: () => void): (() => void) =>
  window.desktop?.onFullScreenChange(listener) ?? (() => undefined);

const getSnapshot = (): boolean => window.desktop?.isFullScreen() ?? false;

interface DesktopWindowState {
  isDesktop: boolean;
  isFullScreen: boolean;
  hasMacTitleBarInset: boolean;
}

/** 订阅桌面窗口状态；Web 环境返回非桌面、非全屏状态。 */
export const useDesktopWindowState = (): DesktopWindowState => {
  const desktop = isDesktop();
  const fullScreen = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return {
    isDesktop: desktop,
    isFullScreen: fullScreen,
    hasMacTitleBarInset: desktop && isMac() && !fullScreen,
  };
};
