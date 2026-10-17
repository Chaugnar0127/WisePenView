type NoteHistoryListener = () => void;

const flushListeners = new Set<NoteHistoryListener>();
const appliedListeners = new Set<NoteHistoryListener>();

/**
 * 注册撤销/重做前的提交回调。
 * 行内编辑等先写 DOM、后写 Yjs 的内容，必须在快捷键执行前同步提交。
 */
export function registerNoteHistoryFlush(listener: NoteHistoryListener) {
  flushListeners.add(listener);
  return () => {
    flushListeners.delete(listener);
  };
}

/** 注册撤销/重做后的同步回调，用于把最新内容写回受控 DOM。 */
export function registerNoteHistoryApplied(listener: NoteHistoryListener) {
  appliedListeners.add(listener);
  return () => {
    appliedListeners.delete(listener);
  };
}

export function flushNoteHistoryPendingEdits() {
  flushListeners.forEach((listener) => listener());
}

export function notifyNoteHistoryApplied() {
  appliedListeners.forEach((listener) => listener());
}
