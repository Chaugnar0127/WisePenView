import {
  GUIDE_ACTION_ID,
  GUIDE_TOOL_ID,
  type GuideActionId,
  type GuideToolId,
} from '@/constants/tour';

import { findGuideTarget } from './findGuideTarget';
import { getGuideActionHandler } from './guideActionHandlers';

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

function waitFor(find: () => HTMLElement | null, timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (find() || performance.now() - start > timeout) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

const COURSE_PAGE_READY_TARGETS = {
  [GUIDE_ACTION_ID.openCourseHome]: GUIDE_TOOL_ID.courseEnterLearning,
  [GUIDE_ACTION_ID.openCourseMaterials]: GUIDE_TOOL_ID.courseMaterialsPage,
  [GUIDE_ACTION_ID.openCourseMembers]: GUIDE_TOOL_ID.courseMembersPage,
} as const satisfies Partial<Record<GuideActionId, GuideToolId>>;

type CoursePageActionId = keyof typeof COURSE_PAGE_READY_TARGETS;

function isCoursePageAction(id: GuideActionId): id is CoursePageActionId {
  return id in COURSE_PAGE_READY_TARGETS;
}

/** 为当前 GuideHost 创建界面动作适配器；所有打开动作都由组件注册的直接 setter 执行。 */
export function createGuideActions({ openChat }: GuideActionOptions): GuideActionPort {
  const pendingCloses = new Set<GuideActionId>();
  const owned = new Set<GuideActionId>();
  let closeAfterStepId: string | null = null;

  function showAction(id: GuideActionId): void | Promise<void> {
    const handler = getGuideActionHandler(id);
    if (!handler) return;
    if (handler.isOpen?.()) {
      return;
    }
    if (handler.close) owned.add(id);
    return handler.open();
  }

  function hideAction(id: GuideActionId, immediate = false, stepId?: string): void {
    const queued = pendingCloses.has(id);
    if (!owned.has(id) && !queued) return;
    owned.delete(id);

    const handler = getGuideActionHandler(id);
    if (!handler?.close || (handler.isOpen && !handler.isOpen())) {
      pendingCloses.delete(id);
      return;
    }
    if (immediate) {
      pendingCloses.delete(id);
      closeAfterStepId = null;
      handler.close();
      return;
    }
    // 等离开这一步、下一步气泡挂上再收，避免目标被卸载后 Joyride 停在原地。
    pendingCloses.add(id);
    closeAfterStepId = stepId ?? closeAfterStepId;
  }

  function prepare(id: GuideActionId): void | Promise<void> {
    if (id === GUIDE_ACTION_ID.openChat) {
      openChat();
      return waitFor(() => target(GUIDE_TOOL_ID.chatComposer)).then(() => closeAll());
    }
    if (isCoursePageAction(id)) {
      const ready = COURSE_PAGE_READY_TARGETS[id];
      if (target(ready)) return;
      const handler = getGuideActionHandler(id);
      if (!handler) return;
      return Promise.resolve(handler.open()).then(() => waitFor(() => target(ready), 3000));
    }
    return showAction(id);
  }

  function restore(id: GuideActionId, stepId?: string): void {
    if (id === GUIDE_ACTION_ID.openChat || isCoursePageAction(id)) return;
    hideAction(id, false, stepId);
  }

  function flushPending(currentStepId?: string): void {
    if (pendingCloses.size === 0) return;
    if (currentStepId && currentStepId === closeAfterStepId) return;
    const queued = [...pendingCloses];
    pendingCloses.clear();
    closeAfterStepId = null;
    for (const id of queued) {
      const handler = getGuideActionHandler(id);
      if (!handler?.close) continue;
      if (handler.isOpen && !handler.isOpen()) continue;
      handler.close();
    }
  }

  function closeAll(): void {
    const active = new Set([...owned, ...pendingCloses]);
    for (const id of active) hideAction(id, true);
  }

  return { prepare, restore, flushPending, closeAll };
}
