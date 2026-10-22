export type NoteScrollTargetResolver = () => HTMLElement | null;

function findScrollableAncestor(
  element: HTMLElement,
  options: { ignoreScrollableWithin?: HTMLElement } = {}
): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const shouldIgnore =
      options.ignoreScrollableWithin &&
      (parent === options.ignoreScrollableWithin ||
        options.ignoreScrollableWithin.contains(parent));
    const { overflowY } = window.getComputedStyle(parent);
    if (
      !shouldIgnore &&
      (overflowY === 'auto' || overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export function getPreferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function scrollNoteEditorTargetIntoView(
  target: HTMLElement,
  options: { block?: ScrollLogicalPosition; ignoreScrollableWithin?: HTMLElement } = {}
): Promise<void> {
  const behavior = getPreferredScrollBehavior();
  const block = options.block ?? 'center';
  const scrollContainer = findScrollableAncestor(target, options);
  if (!scrollContainer) {
    target.scrollIntoView({ behavior, block, inline: 'nearest' });
    return waitForScrollEnd(document, behavior);
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetTop = scrollContainer.scrollTop + targetRect.top - containerRect.top;
  if (block === 'nearest') {
    const targetBottom = targetTop + targetRect.height;
    if (targetTop < scrollContainer.scrollTop) {
      const destination = Math.max(0, targetTop);
      if (Math.abs(destination - scrollContainer.scrollTop) < 1) return Promise.resolve();
      const scrollEnd = waitForScrollEnd(scrollContainer, behavior);
      scrollContainer.scrollTo({ top: destination, behavior });
      return scrollEnd;
    } else if (targetBottom > scrollContainer.scrollTop + scrollContainer.clientHeight) {
      const destination = Math.max(0, targetBottom - scrollContainer.clientHeight);
      if (Math.abs(destination - scrollContainer.scrollTop) < 1) return Promise.resolve();
      const scrollEnd = waitForScrollEnd(scrollContainer, behavior);
      scrollContainer.scrollTo({
        top: destination,
        behavior,
      });
      return scrollEnd;
    }
    return Promise.resolve();
  }

  const scrollTop = Math.max(0, targetTop - (scrollContainer.clientHeight - targetRect.height) / 2);
  if (Math.abs(scrollTop - scrollContainer.scrollTop) < 1) return Promise.resolve();
  const scrollEnd = waitForScrollEnd(scrollContainer, behavior);
  scrollContainer.scrollTo({ top: scrollTop, behavior });
  return scrollEnd;
}

function waitForScrollEnd(target: Document | HTMLElement, behavior: ScrollBehavior): Promise<void> {
  if (behavior === 'auto') return Promise.resolve();

  return new Promise((resolve) => {
    let quietTimer: number | null = null;
    const maxTimer = window.setTimeout(finish, 1_500);
    target.addEventListener('scroll', handleScroll);

    function finish() {
      window.clearTimeout(maxTimer);
      if (quietTimer !== null) window.clearTimeout(quietTimer);
      target.removeEventListener('scroll', handleScroll);
      target.removeEventListener('scrollend', finish);
      resolve();
    }

    function handleScroll() {
      if (quietTimer !== null) window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(finish, 120);
    }

    target.addEventListener('scrollend', finish, { once: true });
  });
}
