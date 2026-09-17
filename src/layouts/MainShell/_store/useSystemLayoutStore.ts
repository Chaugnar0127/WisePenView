import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { clampSidebarWidth, MAIN_SIDEBAR_EXPANDED_WIDTH } from '@/constants/layoutScale';
import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';

interface SystemLayoutState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
}

const DEFAULT_SYSTEM_LAYOUT_STATE = {
  sidebarCollapsed: false,
  sidebarWidth: MAIN_SIDEBAR_EXPANDED_WIDTH,
};

const migrateSystemLayoutState = (persisted: unknown): typeof DEFAULT_SYSTEM_LAYOUT_STATE => {
  const state = persisted as
    | Partial<{
        adminSidebarWidth: number;
        mainSidebarCollapsed: boolean;
        sidebarCollapsed: boolean;
        sidebarWidth: number;
      }>
    | undefined;

  return {
    sidebarCollapsed:
      state?.sidebarCollapsed ??
      state?.mainSidebarCollapsed ??
      DEFAULT_SYSTEM_LAYOUT_STATE.sidebarCollapsed,
    sidebarWidth: clampSidebarWidth(
      state?.sidebarWidth ?? state?.adminSidebarWidth ?? DEFAULT_SYSTEM_LAYOUT_STATE.sidebarWidth
    ),
  };
};

export const useSystemLayoutStore = create<SystemLayoutState>()(
  persist(
    (set) => ({
      ...DEFAULT_SYSTEM_LAYOUT_STATE,
      setSidebarCollapsed: (collapsed) =>
        set((state) =>
          state.sidebarCollapsed === collapsed ? state : { sidebarCollapsed: collapsed }
        ),
      setSidebarWidth: (width) =>
        set((state) => {
          const sidebarWidth = clampSidebarWidth(width);
          return state.sidebarWidth === sidebarWidth ? state : { sidebarWidth };
        }),
    }),
    {
      name: 'system-layout',
      storage: createStoreJSONStorage('tab'),
      version: 3,
      migrate: migrateSystemLayoutState,
    }
  )
);

const resetSystemLayoutStore = (): void => {
  useSystemLayoutStore.setState(DEFAULT_SYSTEM_LAYOUT_STATE);
};

registerStore({
  id: 'layout.system-layout',
  scope: 'tab',
  reset: resetSystemLayoutStore,
});
