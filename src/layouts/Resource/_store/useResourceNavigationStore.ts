import { buildDriveNodeScope, type DriveNodeScope } from '@/domains/Drive';
import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResourceNavigationResourceLocation {
  resourceId: string;
  parentNodeId: string;
  nodeId?: string;
}

export interface ResourceNavigationLocation {
  scope: DriveNodeScope;
  resource?: ResourceNavigationResourceLocation;
}

interface ResourceNavigationState {
  location: ResourceNavigationLocation;
  navigateToScope: (scope: DriveNodeScope) => void;
  navigateToResource: (
    location: ResourceNavigationLocation & { resource: ResourceNavigationResourceLocation }
  ) => void;
}

const DEFAULT_LOCATION: ResourceNavigationLocation = {
  scope: buildDriveNodeScope(),
};

export const useResourceNavigationStore = create<ResourceNavigationState>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,
      navigateToScope: (scope) => set({ location: { scope } }),
      navigateToResource: (location) => set({ location }),
    }),
    { name: 'resource-navigation', storage: createStoreJSONStorage('tab') }
  )
);

const resetResourceNavigationStore = (): void => {
  useResourceNavigationStore.setState({ location: DEFAULT_LOCATION });
};

registerStore({
  id: 'resource.navigation',
  scope: 'tab',
  reset: resetResourceNavigationStore,
});
