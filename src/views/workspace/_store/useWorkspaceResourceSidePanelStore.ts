import { RESOURCE_SIDE_PANEL_MIN_WIDTH } from '@/constants/layoutScale';
import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const WORKSPACE_RESOURCE_SIDE_PANEL_DEFAULT_WIDTH = 360;
export const WORKSPACE_RESOURCE_SIDE_PANEL_MIN_WIDTH = RESOURCE_SIDE_PANEL_MIN_WIDTH;
export const WORKSPACE_RESOURCE_SIDE_PANEL_MAX_WIDTH = 560;

export type WorkspaceResourceSidePanelMode = 'closed' | 'inlineComment' | 'comment';

interface WorkspaceResourceSidePanelState {
  modeByResourceId: Record<string, WorkspaceResourceSidePanelMode>;
  width: number;
  setMode: (resourceId: string, mode: WorkspaceResourceSidePanelMode) => void;
  toggleMode: (resourceId: string, mode: Exclude<WorkspaceResourceSidePanelMode, 'closed'>) => void;
  setWidth: (width: number) => void;
}

const DEFAULT_STATE = {
  modeByResourceId: {} as Record<string, WorkspaceResourceSidePanelMode>,
  width: WORKSPACE_RESOURCE_SIDE_PANEL_DEFAULT_WIDTH,
};

function normalizeWidth(width: number): number {
  return Math.min(
    Math.max(Math.round(width), WORKSPACE_RESOURCE_SIDE_PANEL_MIN_WIDTH),
    WORKSPACE_RESOURCE_SIDE_PANEL_MAX_WIDTH
  );
}

export const useWorkspaceResourceSidePanelStore = create<WorkspaceResourceSidePanelState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setMode: (resourceId, mode) =>
        set((state) => {
          if (state.modeByResourceId[resourceId] === mode) return state;
          return { modeByResourceId: { ...state.modeByResourceId, [resourceId]: mode } };
        }),
      toggleMode: (resourceId, mode) => {
        const currentMode = get().modeByResourceId[resourceId] ?? 'closed';
        get().setMode(resourceId, currentMode === mode ? 'closed' : mode);
      },
      setWidth: (width) => {
        const nextWidth = normalizeWidth(width);
        set((state) => (state.width === nextWidth ? state : { width: nextWidth }));
      },
    }),
    {
      name: 'workspace-resource-side-panel',
      storage: createStoreJSONStorage('tab'),
      partialize: (state) => ({ width: state.width }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<WorkspaceResourceSidePanelState> | undefined;
        return {
          ...current,
          ...stored,
          width: normalizeWidth(stored?.width ?? current.width),
          modeByResourceId: current.modeByResourceId,
        };
      },
    }
  )
);

const resetWorkspaceResourceSidePanelStore = (): void => {
  useWorkspaceResourceSidePanelStore.setState(DEFAULT_STATE);
};

registerStore({
  id: 'workspace.resource-side-panel',
  scope: 'tab',
  reset: resetWorkspaceResourceSidePanelStore,
});
