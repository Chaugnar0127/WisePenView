import type { GuideTourId } from '@/constants/tour';

let pageTourId: GuideTourId | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** 当前已挂载页面登记的指引。导航层订阅这个 id。 */
export function getPageTourId(): GuideTourId | null {
  return pageTourId;
}

export function subscribePageTours(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerPageTour(tourId: GuideTourId): () => void {
  pageTourId = tourId;
  emit();
  return () => {
    if (pageTourId !== tourId) return;
    pageTourId = null;
    emit();
  };
}
