import type { GuideToolId } from '@/constants/tour';

function isShown(element: HTMLElement): boolean {
  if (element.hidden) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** 按 GuideAnchor 上的 data-guide-tool-id 取当前可见的那一个锚点。 */
export function findGuideTarget(id: GuideToolId, root: ParentNode = document): HTMLElement | null {
  const nodes = root.querySelectorAll(`[data-guide-tool-id="${CSS.escape(id)}"]`);
  for (const node of nodes) {
    if (node instanceof HTMLElement && isShown(node)) return node;
  }
  return null;
}
