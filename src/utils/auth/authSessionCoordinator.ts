import {
  buildLoginPathForCurrentLocation,
  buildRegisterPathForCurrentLocation,
} from '@/bootstrap/authContinuation';
import { clearAllServiceCaches } from '@/domains/_shared/cacheRegistry';
import { resetSessionStores } from '@/store/lifecycle';

type AuthSessionEventType = 'login' | 'logout' | 'unauthorized';

interface AuthSessionEventPayload {
  type: AuthSessionEventType;
  sourceTabId: string;
  eventId: string;
}

const AUTH_SESSION_EVENT_KEY = 'wisepen:auth-session-event';
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let eventSequence = 0;
let sessionEnded = false;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseAuthSessionEvent = (value: string): AuthSessionEventPayload | undefined => {
  const payload: unknown = JSON.parse(value);
  if (!isRecord(payload)) return undefined;

  const { type, sourceTabId, eventId } = payload;
  if (
    (type !== 'login' && type !== 'logout' && type !== 'unauthorized') ||
    typeof sourceTabId !== 'string' ||
    typeof eventId !== 'string'
  ) {
    return undefined;
  }

  return { type, sourceTabId, eventId };
};

const resetSessionState = (): void => {
  clearAllServiceCaches();
  resetSessionStores();
};

const redirectToLogin = (): void => {
  if (window.location.pathname !== '/login') {
    window.location.replace(buildLoginPathForCurrentLocation());
  }
};

const redirectToRegister = (): void => {
  if (window.location.pathname !== '/register') {
    window.location.replace(buildRegisterPathForCurrentLocation());
  }
};

const applySessionEvent = (type: AuthSessionEventType): void => {
  if (type === 'login') {
    sessionEnded = false;
    resetSessionState();
    return;
  }

  if (!sessionEnded) {
    sessionEnded = true;
    resetSessionState();
  }
  if (type === 'unauthorized') {
    redirectToRegister();
    return;
  }
  redirectToLogin();
};

const broadcastSessionEvent = (type: AuthSessionEventType): void => {
  try {
    eventSequence += 1;
    const payload: AuthSessionEventPayload = {
      type,
      sourceTabId: TAB_ID,
      eventId: `${TAB_ID}-${Date.now()}-${eventSequence}`,
    };
    localStorage.setItem(AUTH_SESSION_EVENT_KEY, JSON.stringify(payload));
  } catch {
    // 忽略浏览器存储异常，避免影响认证主流程
  }
};

const coordinateSessionEvent = (type: AuthSessionEventType): void => {
  if ((type === 'logout' || type === 'unauthorized') && sessionEnded) {
    if (type === 'unauthorized') {
      redirectToRegister();
      return;
    }
    redirectToLogin();
    return;
  }

  applySessionEvent(type);
  broadcastSessionEvent(type);
};

export const authSessionCoordinator = {
  login(): void {
    coordinateSessionEvent('login');
  },

  logout(): void {
    coordinateSessionEvent('logout');
  },

  unauthorized(): void {
    coordinateSessionEvent('unauthorized');
  },

  subscribe(): () => void {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== AUTH_SESSION_EVENT_KEY || !event.newValue) return;

      try {
        const payload = parseAuthSessionEvent(event.newValue);
        if (!payload || payload.sourceTabId === TAB_ID) return;
        applySessionEvent(payload.type);
      } catch {
        // 非法 payload 直接忽略
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  },
};
