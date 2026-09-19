import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';

interface ChatPanelState {
  chatPanelCollapsed: boolean;
  chatPanelWidth: number;
  setChatPanelCollapsed: (collapsed: boolean) => void;
  setChatPanelWidth: (width: number) => void;
}

const DEFAULT_CHAT_PANEL_STATE: Pick<ChatPanelState, 'chatPanelCollapsed' | 'chatPanelWidth'> = {
  chatPanelCollapsed: true,
  chatPanelWidth: 480,
};

export const useChatPanelStore = create<ChatPanelState>()(
  persist(
    (set) => ({
      ...DEFAULT_CHAT_PANEL_STATE,
      setChatPanelCollapsed: (collapsed) =>
        set((state) => {
          if (state.chatPanelCollapsed === collapsed) {
            return state;
          }
          return { chatPanelCollapsed: collapsed };
        }),
      setChatPanelWidth: (width) =>
        set((state) => {
          if (state.chatPanelWidth === width) {
            return state;
          }
          return { chatPanelWidth: width };
        }),
    }),
    {
      name: 'chat-panel',
      storage: createStoreJSONStorage('tab'),
      version: 1,
      migrate: () => DEFAULT_CHAT_PANEL_STATE,
    }
  )
);

const resetChatPanelStore = (): void => {
  useChatPanelStore.setState(DEFAULT_CHAT_PANEL_STATE);
};

registerStore({
  id: 'chat-panel.panel-layout',
  scope: 'tab',
  reset: resetChatPanelStore,
});
