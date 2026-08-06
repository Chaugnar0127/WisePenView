import { useSyncExternalStore } from 'react';

const READING_MODE_STORAGE_KEY = 'wisepen-reading-mode';
const READING_MODE_ACCENT_NEUTRAL_MIX_PERCENT = 40;
const readingModeListeners = new Set<() => void>();

function readStoredReadingMode(defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(READING_MODE_STORAGE_KEY) === 'true';
}

let sharedReadingMode = readStoredReadingMode(false);

export function applyReadingModeToDOM(isReadingMode: boolean) {
  document.documentElement.setAttribute('data-reading-mode', String(isReadingMode));
  document.documentElement.style.setProperty(
    '--palette-accent-neutral-mix',
    isReadingMode ? `${READING_MODE_ACCENT_NEUTRAL_MIX_PERCENT}%` : '0%'
  );
}

function emitReadingModeChange() {
  for (const listener of readingModeListeners) {
    listener();
  }
}

function subscribeReadingMode(listener: () => void): () => void {
  readingModeListeners.add(listener);
  return () => readingModeListeners.delete(listener);
}

function setSharedReadingMode(isReadingMode: boolean) {
  if (sharedReadingMode === isReadingMode) return;
  sharedReadingMode = isReadingMode;
  if (typeof window !== 'undefined') {
    localStorage.setItem(READING_MODE_STORAGE_KEY, String(isReadingMode));
  }
  emitReadingModeChange();
}

/** 阅读模式：打开后将 accent 12 色阶固定混入 40% 对应 neutral 色阶 */
export function useAccentNeutralized(defaultValue = false) {
  const isAccentNeutralized = useSyncExternalStore(
    subscribeReadingMode,
    () => sharedReadingMode,
    () => readStoredReadingMode(defaultValue)
  );

  return {
    isAccentNeutralized,
    setAccentNeutralized: setSharedReadingMode,
  };
}
