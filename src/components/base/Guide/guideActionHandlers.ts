import type { GuideActionId } from '@/constants/tour';

export interface GuideActionHandler {
  /** 读取当前界面状态，已打开时引导不会重复执行 open。 */
  isOpen?: () => boolean;
  /** 直接修改组件状态，不通过 DOM 模拟点击。 */
  open: () => void | Promise<void>;
  /** 仅关闭由引导打开的界面。 */
  close?: () => void;
}

export type GuideActionHandlers = Partial<Record<GuideActionId, GuideActionHandler>>;

const handlersById = new Map<GuideActionId, GuideActionHandler[]>();
const warnedDuplicateIds = new Set<GuideActionId>();

export function registerGuideActionHandler(
  id: GuideActionId,
  handler: GuideActionHandler
): () => void {
  const registered = handlersById.get(id) ?? [];
  if (import.meta.env.DEV && registered.length > 0 && !warnedDuplicateIds.has(id)) {
    warnedDuplicateIds.add(id);
    console.warn(`[Guide] 动作 ${id} 存在多个处理器，将使用最后注册的实例。`);
  }
  handlersById.set(id, [...registered, handler]);
  return () => {
    const current = handlersById.get(id);
    if (!current) return;
    const next = current.filter((item) => item !== handler);
    if (next.length === 0) handlersById.delete(id);
    else handlersById.set(id, next);
  };
}

/** 批量登记引导动作，卸载时统一撤销。 */
export function registerGuideActionHandlers(handlers: GuideActionHandlers): () => void {
  const unregister: Array<() => void> = [];
  for (const [id, handler] of Object.entries(handlers)) {
    if (!handler) continue;
    unregister.push(registerGuideActionHandler(id as GuideActionId, handler));
  }
  return () => {
    for (const remove of unregister) remove();
  };
}

/** 同一动作允许多个实例登记，取最后挂载者。 */
export function getGuideActionHandler(id: GuideActionId): GuideActionHandler | undefined {
  const registered = handlersById.get(id);
  return registered?.[registered.length - 1];
}
