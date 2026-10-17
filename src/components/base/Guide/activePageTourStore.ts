import type { GuideTourId } from '@/constants/tour';

interface ActivePageTourEntry {
  tourId: GuideTourId;
  token: symbol;
}

let entries: ActivePageTourEntry[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** 当前生效的页面指引。后挂载的作用域优先。 */
export function getActivePageTourId(): GuideTourId | null {
  return entries[entries.length - 1]?.tourId ?? null;
}

export function subscribeActivePageTour(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 登记页面指引。卸载时只移除自己的登记，并回退到仍在挂载的上一层，
 * 避免嵌套作用域或同页多个 GuideScope 互相清空。
 */
export function registerPageTour(tourId: GuideTourId): () => void {
  const entry: ActivePageTourEntry = { tourId, token: Symbol(tourId) };
  entries = [...entries, entry];
  emit();
  return () => {
    const next = entries.filter((item) => item.token !== entry.token);
    if (next.length === entries.length) return;
    entries = next;
    emit();
  };
}
