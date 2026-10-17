import {
  GUIDE_ACTION_ID,
  GUIDE_TOOL_ID,
  type GuideActionId,
  type GuideToolId,
} from '@/constants/tour';

import { findGuideTarget } from './findGuideTarget';

export interface GuideActionPort {
  prepare: (id: GuideActionId) => void | Promise<void>;
  restore: (id: GuideActionId, stepId?: string) => void;
  flushPending: (stepId?: string) => void;
  closeAll: () => void;
}

interface GuideActionOptions {
  openChat: () => void;
}

function target(id: GuideToolId): HTMLElement | null {
  return findGuideTarget(id);
}

const CONTROL_SELECTOR = 'button, [role="button"], a, input, textarea';

/** 锚点包在控件外面。点锚点本身不会触发里面的按钮。 */
function pressable(element: HTMLElement): HTMLElement {
  if (element.matches(CONTROL_SELECTOR)) return element;
  const control = element.querySelector(CONTROL_SELECTOR);
  return control instanceof HTMLElement ? control : element;
}

function click(element: HTMLElement | null): void {
  if (!element) return;
  pressable(element).click();
}

function releaseInert(element: HTMLElement): void {
  let node: HTMLElement | null = element;
  while (node && node !== document.documentElement) {
    if (node.inert) node.inert = false;
    node = node.parentElement;
  }
}

/**
 * 菜单触发按钮的按下只会打开，不会关上。
 * 模态弹出层里有一颗 1px 的关闭按钮，点它才收得起来。
 */
function dismissPopover(region: HTMLElement | null): boolean {
  const ancestor = region?.closest('[data-slot="dropdown-popover"]');
  const nested = region?.querySelector('[data-slot="dropdown-popover"]');
  const popover = ancestor instanceof HTMLElement ? ancestor : nested;
  if (!(popover instanceof HTMLElement)) return false;
  const button = [...popover.querySelectorAll('button')].find((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width <= 2 && rect.height <= 2;
  });
  if (!(button instanceof HTMLButtonElement)) return false;
  button.click();
  return true;
}

function closeMenu(region: HTMLElement | null, trigger: HTMLElement | null): void {
  if (dismissPopover(region)) return;
  const control = trigger ? pressable(trigger) : null;
  if (!control) return;
  releaseInert(control);
  control.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
    })
  );
  control.click();
}

interface OwnedToggle {
  openedByGuide: boolean;
  isOpen: () => boolean;
  open: () => void | Promise<void>;
  close: () => void;
}

function waitFor(find: () => HTMLElement | null): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (find() || performance.now() - start > 1000) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** 为当前 GuideHost 创建界面动作适配器；open-chat 由布局注入。 */
export function createGuideActions({ openChat }: GuideActionOptions): GuideActionPort {
  const pendingCloses = new Set<OwnedToggle>();
  let closeAfterStepId: string | null = null;

  function showOwned(ui: OwnedToggle): void | Promise<void> {
    if (ui.isOpen()) {
      ui.openedByGuide = false;
      return;
    }
    ui.openedByGuide = true;
    return ui.open();
  }

  function hideOwned(ui: OwnedToggle, immediate = false, stepId?: string): void {
    const queued = pendingCloses.has(ui);
    if (!ui.openedByGuide && !queued) return;
    ui.openedByGuide = false;
    if (!ui.isOpen()) {
      pendingCloses.delete(ui);
      return;
    }
    if (immediate) {
      pendingCloses.delete(ui);
      closeAfterStepId = null;
      ui.close();
      return;
    }
    // 等离开这一步、下一步气泡挂上再收。现在卸掉弹出层，Joyride 会丢掉目标并停在原地。
    pendingCloses.add(ui);
    closeAfterStepId = stepId ?? closeAfterStepId;
  }

  const toggles: Record<Exclude<GuideActionId, 'open-chat'>, OwnedToggle> = {
    [GUIDE_ACTION_ID.openOutline]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.noteOutlineOpen) !== null,
      open: () => click(target(GUIDE_TOOL_ID.noteOutline)),
      close: () => click(target(GUIDE_TOOL_ID.noteOutline)),
    },
    [GUIDE_ACTION_ID.openCreateMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.driveCreateOpen) !== null,
      open: () => click(target(GUIDE_TOOL_ID.driveCreate)),
      close: () =>
        closeMenu(target(GUIDE_TOOL_ID.driveCreateOpen), target(GUIDE_TOOL_ID.driveCreate)),
    },
    [GUIDE_ACTION_ID.openModelMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.chatModelOpen) !== null,
      open: () => click(target(GUIDE_TOOL_ID.chatModel)),
      close: () => closeMenu(target(GUIDE_TOOL_ID.chatModelOpen), target(GUIDE_TOOL_ID.chatModel)),
    },
    [GUIDE_ACTION_ID.openUploadMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.chatUploadOpen) !== null,
      open: () => {
        if (!target(GUIDE_TOOL_ID.chatUploadOpen)) click(target(GUIDE_TOOL_ID.chatUpload));
        return waitFor(() => target(GUIDE_TOOL_ID.chatUploadOpen));
      },
      close: () =>
        closeMenu(target(GUIDE_TOOL_ID.chatUploadOpen), target(GUIDE_TOOL_ID.chatUpload)),
    },
    [GUIDE_ACTION_ID.openAgentMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.chatAgentOpen) !== null,
      open: () => {
        if (!target(GUIDE_TOOL_ID.chatAgentOpen)) click(target(GUIDE_TOOL_ID.chatAgent));
        return waitFor(() => target(GUIDE_TOOL_ID.chatAgentOpen));
      },
      close: () => closeMenu(target(GUIDE_TOOL_ID.chatAgentOpen), target(GUIDE_TOOL_ID.chatAgent)),
    },
    [GUIDE_ACTION_ID.openSkillMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.chatSkillOpen) !== null,
      open: () => {
        if (!target(GUIDE_TOOL_ID.chatSkillOpen)) click(target(GUIDE_TOOL_ID.chatSkill));
        return waitFor(() => target(GUIDE_TOOL_ID.chatSkillOpen));
      },
      close: () => closeMenu(target(GUIDE_TOOL_ID.chatSkillOpen), target(GUIDE_TOOL_ID.chatSkill)),
    },
    [GUIDE_ACTION_ID.openAccountMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.sidebarAccountOpen) !== null,
      open: () => click(target(GUIDE_TOOL_ID.sidebarAccount)),
      close: () =>
        closeMenu(target(GUIDE_TOOL_ID.sidebarAccountOpen), target(GUIDE_TOOL_ID.sidebarAccount)),
    },
    [GUIDE_ACTION_ID.openResourceMenu]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.noteMoreOpen) !== null,
      open: () => click(target(GUIDE_TOOL_ID.noteMore)),
      close: () => closeMenu(target(GUIDE_TOOL_ID.noteMoreOpen), target(GUIDE_TOOL_ID.noteMore)),
    },
    [GUIDE_ACTION_ID.openDetails]: {
      openedByGuide: false,
      isOpen: () => target(GUIDE_TOOL_ID.driveDetailsOpen) !== null,
      open: () => {
        if (!target(GUIDE_TOOL_ID.driveDetailsOpen)) click(target(GUIDE_TOOL_ID.driveDetails));
        return waitFor(() => target(GUIDE_TOOL_ID.driveDetailsOpen));
      },
      close: () => click(target(GUIDE_TOOL_ID.driveDetails)),
    },
  };

  function prepare(id: GuideActionId): void | Promise<void> {
    if (id === GUIDE_ACTION_ID.openChat) {
      openChat();
      return waitFor(() => target(GUIDE_TOOL_ID.chatComposer));
    }
    return showOwned(toggles[id]);
  }

  function restore(id: GuideActionId, stepId?: string): void {
    if (id === GUIDE_ACTION_ID.openChat) return;
    hideOwned(toggles[id], false, stepId);
  }

  function flushPending(currentStepId?: string): void {
    if (pendingCloses.size === 0) return;
    if (currentStepId && currentStepId === closeAfterStepId) return;
    const queued = [...pendingCloses];
    pendingCloses.clear();
    closeAfterStepId = null;
    for (const ui of queued) {
      if (ui.isOpen()) ui.close();
    }
  }

  function closeAll(): void {
    for (const ui of Object.values(toggles)) hideOwned(ui, true);
  }

  return { prepare, restore, flushPending, closeAll };
}
