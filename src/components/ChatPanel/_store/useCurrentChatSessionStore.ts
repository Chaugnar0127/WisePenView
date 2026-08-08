import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';

interface CurrentChatSessionState {
  currentSessionId?: string;
  currentSessionTitle?: string;
  currentSessionAgentId?: string | null;
  currentSessionAgentVersion?: number | null;
  setCurrentSession: (session: {
    id: string;
    title: string;
    agentId?: string | null;
    agentVersion?: number | null;
  }) => void;
  clearCurrentSession: () => void;
}

const DEFAULT_CURRENT_CHAT_SESSION_STATE: Pick<
  CurrentChatSessionState,
  | 'currentSessionId'
  | 'currentSessionTitle'
  | 'currentSessionAgentId'
  | 'currentSessionAgentVersion'
> = {
  currentSessionId: undefined,
  currentSessionTitle: undefined,
  currentSessionAgentId: undefined,
  currentSessionAgentVersion: undefined,
};

export const useCurrentChatSessionStore = create<CurrentChatSessionState>()(
  persist(
    (set) => ({
      ...DEFAULT_CURRENT_CHAT_SESSION_STATE,
      setCurrentSession: ({ id, title, agentId, agentVersion }) => {
        set((state) => {
          if (
            state.currentSessionId === id &&
            state.currentSessionTitle === title &&
            state.currentSessionAgentId === agentId &&
            state.currentSessionAgentVersion === agentVersion
          ) {
            return state;
          }
          return {
            currentSessionId: id,
            currentSessionTitle: title,
            currentSessionAgentId: agentId,
            currentSessionAgentVersion: agentVersion,
          };
        });
      },
      clearCurrentSession: () =>
        set((state) => {
          if (
            state.currentSessionId == null &&
            state.currentSessionTitle == null &&
            state.currentSessionAgentId == null &&
            state.currentSessionAgentVersion == null
          ) {
            return state;
          }
          return DEFAULT_CURRENT_CHAT_SESSION_STATE;
        }),
    }),
    {
      name: 'current-chat-session',
      storage: createStoreJSONStorage('tab'),
      version: 1,
      migrate: () => DEFAULT_CURRENT_CHAT_SESSION_STATE,
    }
  )
);

const resetCurrentChatSessionStore = (): void => {
  useCurrentChatSessionStore.setState(DEFAULT_CURRENT_CHAT_SESSION_STATE);
};

registerStore({
  id: 'chat-panel.current-session',
  scope: 'tab',
  reset: resetCurrentChatSessionStore,
});
