import type { KeyboardEvent } from 'react';
import type * as Y from 'yjs';

import type { WisepenProvider } from '@/domains/Note';

import { flushNoteHistoryPendingEdits, notifyNoteHistoryApplied } from './noteHistoryBridge';

/**
 * 捕获阶段接管撤销/重做快捷键，统一走 Y.UndoManager。
 * 同时异步上报 sendIntent，保证埋点来源与快捷键一致。
 */
interface UseNoteCaptureKeyEventOptions {
  provider: WisepenProvider;
  undoManager: Y.UndoManager;
  readOnly: boolean;
}

export function useNoteCaptureKeyEvent({
  provider,
  undoManager,
  readOnly,
}: UseNoteCaptureKeyEventOptions) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || e.nativeEvent.isComposing) return;

    const emitIntentDeferred = (
      operationType: Parameters<WisepenProvider['sendIntent']>[0],
      source: string
    ) => {
      window.setTimeout(() => {
        provider.sendIntent(operationType, source);
      }, 0);
    };

    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    // 原生输入控件有自己的撤销栈，拦截后会导致文本框内的 Cmd+Z 失效。
    const target = e.target;
    const isNativeTextControl =
      target instanceof HTMLElement && target.closest('input, textarea, select') !== null;

    const raw = e.key;
    const k = raw.length === 1 ? raw.toLowerCase() : raw;

    if (k === 'c') {
      emitIntentDeferred('COPY', e.metaKey ? 'Cmd+C' : 'Ctrl+C');
      return;
    }

    if (k === 'v') {
      emitIntentDeferred('PASTE', e.metaKey ? 'Cmd+V' : 'Ctrl+V');
      return;
    }

    if (k === 'z') {
      if (isNativeTextControl) return;
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      // 行内编辑可能还没写入 Yjs，先提交再撤销，保证本次快捷键命中刚输入的内容。
      flushNoteHistoryPendingEdits();
      if (e.shiftKey) {
        undoManager.redo();
        notifyNoteHistoryApplied();
        emitIntentDeferred('REDO', e.metaKey ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z');
      } else {
        undoManager.undo();
        notifyNoteHistoryApplied();
        emitIntentDeferred('UNDO', e.metaKey ? 'Cmd+Z' : 'Ctrl+Z');
      }
      return;
    }

    if (k === 'y' && e.ctrlKey && !e.metaKey) {
      if (isNativeTextControl) return;
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      flushNoteHistoryPendingEdits();
      undoManager.redo();
      notifyNoteHistoryApplied();
      emitIntentDeferred('REDO', 'Ctrl+Y');
    }
  };
}
