import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { registerStore } from '@/store/lifecycle';

import type { ChatSession } from '../service/index.type';

interface SessionCache {
  sessions: ReadonlyMap<string, ChatSession>;
  generation: number;
}

// 只快取伺服器資料；目前選中的 ID 一律從 URL 取得，不持久化或反向導航。
const sessionCache = createStore<SessionCache>(() => ({ sessions: new Map(), generation: 0 }));

export const getSessionCacheSnapshot = sessionCache.getState;

export function cacheSessions(
  sessions: ChatSession[],
  snapshot: SessionCache,
  fromList = false
): void {
  sessionCache.setState((state) => {
    if (state.generation !== snapshot.generation) return state;
    const next = new Map(state.sessions);
    for (const session of sessions) {
      // 列表開始後若已有重新命名／Agent 更新，不讓舊列表覆蓋新資料。
      if (fromList && state.sessions.get(session.id) !== snapshot.sessions.get(session.id))
        continue;
      next.set(session.id, session);
    }
    return { sessions: next };
  });
}

export function removeCachedSession(sessionId: string, snapshot: SessionCache): void {
  sessionCache.setState((state) => {
    if (state.generation !== snapshot.generation) return state;
    const sessions = new Map(state.sessions);
    sessions.delete(sessionId);
    return { sessions };
  });
}

export const useChatSessionMetadata = (sessionId?: string): ChatSession | undefined =>
  useStore(sessionCache, (state) => (sessionId ? state.sessions.get(sessionId) : undefined));

registerStore({
  id: 'chat.session-metadata',
  scope: 'session',
  reset: () =>
    sessionCache.setState((state) => ({ sessions: new Map(), generation: state.generation + 1 })),
});
