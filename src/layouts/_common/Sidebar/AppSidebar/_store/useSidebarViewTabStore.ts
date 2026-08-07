import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SIDEBAR_VIEW_TAB = {
  SESSIONS: 'session-history',
  DRIVE: 'drive',
  COURSES: 'courses',
} as const;

export type SidebarViewTabKey = (typeof SIDEBAR_VIEW_TAB)[keyof typeof SIDEBAR_VIEW_TAB];

interface SidebarViewTabState {
  selectedTab: SidebarViewTabKey;
  setSelectedTab: (tab: SidebarViewTabKey) => void;
}

const DEFAULT_SIDEBAR_VIEW_TAB_STATE = {
  selectedTab: SIDEBAR_VIEW_TAB.DRIVE,
};

export const useSidebarViewTabStore = create<SidebarViewTabState>()(
  persist(
    (set) => ({
      ...DEFAULT_SIDEBAR_VIEW_TAB_STATE,
      setSelectedTab: (tab) => set({ selectedTab: tab }),
    }),
    {
      name: 'sidebar-view-tab',
      storage: createStoreJSONStorage('tab'),
    }
  )
);

const resetSidebarViewTabStore = (): void => {
  useSidebarViewTabStore.setState(DEFAULT_SIDEBAR_VIEW_TAB_STATE);
};

registerStore({
  id: 'sidebar.view-tab',
  scope: 'tab',
  reset: resetSidebarViewTabStore,
});
