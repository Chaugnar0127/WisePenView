import { useSyncExternalStore } from 'react';

import { MAIN_LAYOUT_DRAWER_MAX_WIDTH } from '@/constants/layoutScale';

const MAIN_LAYOUT_DRAWER_QUERY = `(max-width: ${MAIN_LAYOUT_DRAWER_MAX_WIDTH - 0.02}px)`;

interface MainLayoutMobileSnapshot {
  breakpointVersion: number;
  isMobileLayout: boolean;
}

const SERVER_SNAPSHOT: MainLayoutMobileSnapshot = {
  breakpointVersion: 0,
  isMobileLayout: false,
};

let currentSnapshot: MainLayoutMobileSnapshot = SERVER_SNAPSHOT;

const getMainLayoutMobileMatches = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(MAIN_LAYOUT_DRAWER_QUERY).matches;

const syncMainLayoutMobileSnapshot = (): void => {
  const isMobileLayout = getMainLayoutMobileMatches();
  if (currentSnapshot.isMobileLayout === isMobileLayout) return;
  currentSnapshot = {
    breakpointVersion: currentSnapshot.breakpointVersion + 1,
    isMobileLayout,
  };
};

const subscribeMainLayoutMobile = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const query = window.matchMedia(MAIN_LAYOUT_DRAWER_QUERY);
  const handleChange = () => {
    syncMainLayoutMobileSnapshot();
    listener();
  };

  query.addEventListener('change', handleChange);
  return () => query.removeEventListener('change', handleChange);
};

const getMainLayoutMobileSnapshot = (): MainLayoutMobileSnapshot => {
  syncMainLayoutMobileSnapshot();
  return currentSnapshot;
};

const getServerMainLayoutMobileSnapshot = (): MainLayoutMobileSnapshot => SERVER_SNAPSHOT;

/** 与 MainLayout 侧栏 Drawer 断点保持一致。 */
export function useMainLayoutMobileSnapshot(): MainLayoutMobileSnapshot {
  return useSyncExternalStore(
    subscribeMainLayoutMobile,
    getMainLayoutMobileSnapshot,
    getServerMainLayoutMobileSnapshot
  );
}

/** 与 MainLayout 侧栏 Drawer 断点保持一致。 */
export function useMainLayoutMobile(): boolean {
  return useMainLayoutMobileSnapshot().isMobileLayout;
}
