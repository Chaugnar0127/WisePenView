import { APP_HEADER_NAV_KEY, type AppHeaderNavKey } from '@/bootstrap/routeMeta';
import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppHeaderNavState {
  selectedKey?: AppHeaderNavKey;
  setSelectedKey: (key: AppHeaderNavKey) => void;
}

const DEFAULT_APP_HEADER_NAV_STATE = {
  selectedKey: APP_HEADER_NAV_KEY.DRIVE,
};

export const useAppHeaderNavStore = create<AppHeaderNavState>()(
  persist(
    (set) => ({
      ...DEFAULT_APP_HEADER_NAV_STATE,
      setSelectedKey: (key) => set({ selectedKey: key }),
    }),
    {
      name: 'app-header-nav',
      storage: createStoreJSONStorage('tab'),
      version: 1,
      migrate: () => DEFAULT_APP_HEADER_NAV_STATE,
    }
  )
);

const resetAppHeaderNavStore = (): void => {
  useAppHeaderNavStore.setState(DEFAULT_APP_HEADER_NAV_STATE);
};

registerStore({
  id: 'sidebar.app-header-nav',
  scope: 'tab',
  reset: resetAppHeaderNavStore,
});
