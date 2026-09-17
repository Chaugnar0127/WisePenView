import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';

interface SystemLayoutState {
  mainSidebarCollapsed: boolean;
  adminSidebarWidth: number;
  setMainSidebarCollapsed: (collapsed: boolean) => void;
  setAdminSidebarWidth: (width: number) => void;
}

const DEFAULT_SYSTEM_LAYOUT_STATE = {
  mainSidebarCollapsed: false,
  adminSidebarWidth: 308,
};

const setWidth =
  <K extends keyof typeof DEFAULT_SYSTEM_LAYOUT_STATE>(key: K, width: number) =>
  (state: SystemLayoutState): Partial<SystemLayoutState> | SystemLayoutState => {
    if (state[key] === width) {
      return state;
    }
    return { [key]: width } as Pick<SystemLayoutState, K>;
  };

export const useSystemLayoutStore = create<SystemLayoutState>()(
  persist(
    (set) => ({
      ...DEFAULT_SYSTEM_LAYOUT_STATE,
      setMainSidebarCollapsed: (collapsed) =>
        set((state) =>
          state.mainSidebarCollapsed === collapsed ? state : { mainSidebarCollapsed: collapsed }
        ),
      setAdminSidebarWidth: (width) => set((state) => setWidth('adminSidebarWidth', width)(state)),
    }),
    {
      name: 'system-layout',
      storage: createStoreJSONStorage('tab'),
      version: 2,
      migrate: () => DEFAULT_SYSTEM_LAYOUT_STATE,
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
