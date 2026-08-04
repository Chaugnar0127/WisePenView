import type { AppHeaderNavKey } from '@/layouts/_common/Sidebar/appSidebarNavigation';
import { registerStore } from '@/store/lifecycle';
import { create } from 'zustand';

export const APP_SIDEBAR_TAB = {
  SESSIONS: 'session-history',
  DRIVE: 'drive',
  COURSES: 'courses',
} as const;

export type AppSidebarTabKey = (typeof APP_SIDEBAR_TAB)[keyof typeof APP_SIDEBAR_TAB];

interface AppSidebarSelectionState {
  headerNavInitialized: boolean;
  selectedHeaderNavKey: AppHeaderNavKey | undefined;
  tabInitialized: boolean;
  selectedTab: AppSidebarTabKey;
  initializeSelectedHeaderNavKey: (key: AppHeaderNavKey) => void;
  initializeSelectedTab: (key: AppSidebarTabKey) => void;
  setSelectedHeaderNavKey: (key: AppHeaderNavKey) => void;
  setSelectedTab: (key: AppSidebarTabKey) => void;
}

const DEFAULT_APP_SIDEBAR_SELECTION_STATE = {
  headerNavInitialized: false,
  selectedHeaderNavKey: undefined,
  tabInitialized: false,
  selectedTab: APP_SIDEBAR_TAB.SESSIONS,
};

export const useAppSidebarSelectionStore = create<AppSidebarSelectionState>()((set) => ({
  ...DEFAULT_APP_SIDEBAR_SELECTION_STATE,
  initializeSelectedHeaderNavKey: (key) =>
    set((state) =>
      state.headerNavInitialized ? state : { headerNavInitialized: true, selectedHeaderNavKey: key }
    ),
  initializeSelectedTab: (key) =>
    set((state) => (state.tabInitialized ? state : { tabInitialized: true, selectedTab: key })),
  setSelectedHeaderNavKey: (key) => set({ headerNavInitialized: true, selectedHeaderNavKey: key }),
  setSelectedTab: (key) => set({ tabInitialized: true, selectedTab: key }),
}));

const resetAppSidebarSelectionStore = (): void => {
  useAppSidebarSelectionStore.setState(DEFAULT_APP_SIDEBAR_SELECTION_STATE);
};

registerStore({
  id: 'app-sidebar.selection',
  scope: 'tab',
  reset: resetAppSidebarSelectionStore,
});
