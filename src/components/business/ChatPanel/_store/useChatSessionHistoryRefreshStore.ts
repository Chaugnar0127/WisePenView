import { create } from 'zustand';

import { registerStore } from '@/store/lifecycle';

interface ChatSessionHistoryRefreshState {
  refreshVersion: number;
  requestRefresh: () => void;
}

const DEFAULT_CHAT_SESSION_HISTORY_REFRESH_STATE = {
  refreshVersion: 0,
};

export const useChatSessionHistoryRefreshStore = create<ChatSessionHistoryRefreshState>()(
  (set) => ({
    ...DEFAULT_CHAT_SESSION_HISTORY_REFRESH_STATE,
    requestRefresh: () => set((state) => ({ refreshVersion: state.refreshVersion + 1 })),
  })
);

const resetChatSessionHistoryRefreshStore = (): void => {
  useChatSessionHistoryRefreshStore.setState(DEFAULT_CHAT_SESSION_HISTORY_REFRESH_STATE);
};

registerStore({
  id: 'chat-panel.session-history-refresh',
  scope: 'tab',
  reset: resetChatSessionHistoryRefreshStore,
});
