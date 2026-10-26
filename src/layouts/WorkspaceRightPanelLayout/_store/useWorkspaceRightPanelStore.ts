import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  CHAT_PANEL_MAX_WIDTH,
  CHAT_PANEL_MIN_WIDTH,
  clampWorkspaceContextPanelWidth,
  WORKSPACE_CONTEXT_PANEL_DEFAULT_WIDTH,
} from '@/constants/layoutScale';
import { registerStore } from '@/store/lifecycle';
import {
  createStoreJSONStorage,
  readStoreStorageValue,
  removeStoreStorageValue,
} from '@/store/persistence';

import {
  clampWorkspacePanelWidth,
  WORKSPACE_PANEL_IDS,
  type WorkspacePanelId,
} from '../workspacePanelModel';

interface PersistedWorkspaceRightPanel {
  state?: {
    panelWidths?: Partial<Record<WorkspacePanelId, number>>;
  };
}

interface PersistedLegacyChatPanel {
  state?: {
    chatPanelWidth?: number;
  };
}

interface PersistedLegacyResourceSidePanel {
  state?: {
    width?: number;
  };
}

interface WorkspaceRightPanelState {
  activePanelId: WorkspacePanelId | null;
  panelWidths: Record<WorkspacePanelId, number>;
  setActivePanel: (panelId: WorkspacePanelId | null) => void;
  setPanelWidth: (panelId: WorkspacePanelId, width: number) => void;
}

const resolveInitialPanelWidths = (): Record<WorkspacePanelId, number> => {
  const current = readStoreStorageValue<PersistedWorkspaceRightPanel>(
    'tab',
    'workspace-right-panel'
  );
  if (current?.state?.panelWidths) {
    return {
      chat: clampWorkspacePanelWidth(
        'chat',
        current.state.panelWidths.chat ??
          Math.min(Math.max(480, CHAT_PANEL_MIN_WIDTH), CHAT_PANEL_MAX_WIDTH)
      ),
      inlineComment: clampWorkspacePanelWidth(
        'inlineComment',
        current.state.panelWidths.inlineComment ?? WORKSPACE_CONTEXT_PANEL_DEFAULT_WIDTH
      ),
      interact: clampWorkspacePanelWidth(
        'interact',
        current.state.panelWidths.interact ?? WORKSPACE_CONTEXT_PANEL_DEFAULT_WIDTH
      ),
    };
  }

  const legacyChat = readStoreStorageValue<PersistedLegacyChatPanel>('tab', 'chat-panel');
  const legacyContext = readStoreStorageValue<PersistedLegacyResourceSidePanel>(
    'tab',
    'resource-side-panel'
  );
  const contextWidth = clampWorkspaceContextPanelWidth(
    legacyContext?.state?.width ?? WORKSPACE_CONTEXT_PANEL_DEFAULT_WIDTH
  );

  removeStoreStorageValue('tab', 'chat-panel');
  removeStoreStorageValue('tab', 'resource-side-panel');

  return {
    chat: clampWorkspacePanelWidth('chat', legacyChat?.state?.chatPanelWidth ?? 480),
    inlineComment: contextWidth,
    interact: contextWidth,
  };
};

const DEFAULT_STATE = {
  activePanelId: 'chat' as WorkspacePanelId | null,
  panelWidths: resolveInitialPanelWidths(),
};

export const useWorkspaceRightPanelStore = create<WorkspaceRightPanelState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setActivePanel: (panelId) =>
        set((state) => (state.activePanelId === panelId ? state : { activePanelId: panelId })),
      setPanelWidth: (panelId, width) => {
        const nextWidth = clampWorkspacePanelWidth(panelId, width);
        set((state) =>
          state.panelWidths[panelId] === nextWidth
            ? state
            : {
                panelWidths: {
                  ...state.panelWidths,
                  [panelId]: nextWidth,
                },
              }
        );
      },
    }),
    {
      name: 'workspace-right-panel',
      storage: createStoreJSONStorage('tab'),
      version: 1,
      partialize: (state) => ({ panelWidths: state.panelWidths }),
      merge: (persisted, current) => {
        const stored = persisted as Pick<WorkspaceRightPanelState, 'panelWidths'> | undefined;
        const panelWidths = { ...current.panelWidths };
        WORKSPACE_PANEL_IDS.forEach((panelId) => {
          const storedWidth = stored?.panelWidths?.[panelId];
          if (storedWidth != null) {
            panelWidths[panelId] = clampWorkspacePanelWidth(panelId, storedWidth);
          }
        });
        return {
          ...current,
          panelWidths,
        };
      },
    }
  )
);

const resetWorkspaceRightPanelStore = (): void => {
  useWorkspaceRightPanelStore.setState(DEFAULT_STATE);
};

registerStore({
  id: 'workspace-right-panel',
  scope: 'tab',
  reset: resetWorkspaceRightPanelStore,
});
