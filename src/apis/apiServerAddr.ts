import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';

/**
 * 运行时 API 地址单例。
 *
 * dev / mock：直接使用 `VITE_API_BASE_URL`。
 * production：默认外网兜底，后台探测内网 `ping`，可达后切到校内地址。
 */

const POLL_INTERVAL_MS = 60_000;
const ADDR_READY_AWAIT_MS = 1_500;

let serverBaseUrl: string;
let extranetBaseUrl: string;
let switchingEnabled = false;
let intranetBaseUrl = '';
let pingPath = '';
let probeTimeoutMs = 1_000;
let addrSuspectedDead = false;
let probeInflight: Promise<void> | null = null;
let pollTimerId: number | null = null;

function readRequiredEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw createClientError(FRONTEND_CLIENT_ERROR.INTERNAL_STATE, {
      reason: '运行时 API 地址配置缺失',
      key,
    });
  }
  return value;
}

async function probeIntranet(): Promise<boolean> {
  const url = new URL(pingPath, intranetBaseUrl).toString();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), probeTimeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

async function probeAndSwitch(): Promise<void> {
  const intranetOk = await probeIntranet();
  if (intranetOk) {
    serverBaseUrl = intranetBaseUrl;
  } else {
    serverBaseUrl = extranetBaseUrl;
  }
  addrSuspectedDead = false;
}

function scheduleNextProbe(): void {
  if (pollTimerId !== null) {
    window.clearTimeout(pollTimerId);
  }
  pollTimerId = window.setTimeout(() => {
    pollTimerId = null;
    void runProbe();
  }, POLL_INTERVAL_MS);
}

function runProbe(): Promise<void> {
  if (probeInflight) return probeInflight;
  probeInflight = (async () => {
    try {
      await probeAndSwitch();
    } finally {
      probeInflight = null;
      scheduleNextProbe();
    }
  })();
  return probeInflight;
}

function triggerImmediateProbe(): void {
  if (!switchingEnabled) return;
  if (pollTimerId !== null) {
    window.clearTimeout(pollTimerId);
    pollTimerId = null;
  }
  void runProbe();
}

export function notifyAddrFailure(): void {
  if (!switchingEnabled) return;
  addrSuspectedDead = true;
  triggerImmediateProbe();
}

export async function awaitAddrReady(maxWaitMs: number = ADDR_READY_AWAIT_MS): Promise<void> {
  if (!switchingEnabled) return;
  if (!addrSuspectedDead) return;
  const inflight = probeInflight;
  if (!inflight) return;
  await Promise.race([
    inflight,
    new Promise<void>((resolve) => window.setTimeout(resolve, maxWaitMs)),
  ]);
}

if (import.meta.env.MODE !== 'production') {
  serverBaseUrl = import.meta.env.VITE_API_BASE_URL;
  extranetBaseUrl = serverBaseUrl;
} else {
  switchingEnabled = true;
  serverBaseUrl = import.meta.env.VITE_API_BASE_URL;
  extranetBaseUrl = serverBaseUrl;
  intranetBaseUrl = readRequiredEnv('VITE_API_BASE_URL_INTRANET');
  pingPath = readRequiredEnv('VITE_INTRANET_PING_PATH');
  probeTimeoutMs = Number(readRequiredEnv('VITE_NETWORK_PROBE_TIMEOUT'));

  void runProbe();

  window.addEventListener('online', () => {
    triggerImmediateProbe();
  });
  window.addEventListener('offline', () => {
    addrSuspectedDead = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerImmediateProbe();
    }
  });
}

export function getApiBaseUrl(): string {
  return serverBaseUrl;
}

export function getNoteCollaborationWsUrl(): string {
  const url = new URL('/note-collab', getApiBaseUrl());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString().replace(/\/$/, '');
}
