import { useMemoizedFn, useUnmount } from 'ahooks';
import { useRef } from 'react';

import {
  NOTE_ANCHOR_HIGHLIGHT_DURATION_MS,
  resolveAnchorHighlightBlockId,
  setNoteAnchorHighlightBlock,
} from '../engines/anchorHighlight/extension';
import { findInlineCommentAnchorElement } from '../engines/inlineComments/extension';
import type { NoteEditorAnchor } from '../index.type';
import type { CustomBlockNoteEditor } from '../registry/noteEditorComposition';
import {
  type NoteScrollTargetResolver,
  scrollNoteEditorTargetIntoView,
} from './noteEditorScrollTarget';
export type { NoteScrollTargetResolver } from './noteEditorScrollTarget';

export interface NoteScrollTargetOptions {
  /** 滚动结束后闪烁目标块，用于目录、外部原文链接与批注的定位反馈。 */
  flash?: boolean;
}

function resolveCurrentBlockElement(editor: CustomBlockNoteEditor): HTMLElement | null {
  const view = editor.prosemirrorView;
  const domNode = view.domAtPos(view.state.selection.from).node;
  const element = domNode instanceof Element ? domNode : domNode.parentElement;
  return element?.closest<HTMLElement>('.bn-block-outer') ?? null;
}

export function useNoteEditorScroll(editor: CustomBlockNoteEditor) {
  const queuedFrameRef = useRef<number | null>(null);
  const navigationIdRef = useRef(0);
  const flashTimerRef = useRef<number | null>(null);

  useUnmount(() => {
    // 递增导航号让未完成的滚动收尾失效，避免卸载后再写编辑器视图
    navigationIdRef.current += 1;
    if (queuedFrameRef.current !== null) window.cancelAnimationFrame(queuedFrameRef.current);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
  });

  /**
   * 闪烁目标块：先清除装饰并强制一次重排，再加回装饰，重复定位同一块时动画也能重播。
   *
   * 装饰由 ProseMirror 写入 DOM。不能退回 classList —— 外部属性改动会被 DOMObserver
   * 判为 DOM 变更，目标块随即被重建，类名在绘制前就被抹掉。
   */
  const flashBlock = useMemoizedFn((blockId: string) => {
    const view = editor.prosemirrorView;
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }

    setNoteAnchorHighlightBlock(view, null);
    // 读布局触发样式重算，让浏览器先看到装饰类被移除，动画才会从头开始
    void view.dom.offsetWidth;
    setNoteAnchorHighlightBlock(view, blockId);
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setNoteAnchorHighlightBlock(view, null);
    }, NOTE_ANCHOR_HIGHLIGHT_DURATION_MS);
  });

  const scrollToTarget = useMemoizedFn(
    (resolveTarget: NoteScrollTargetResolver, options: NoteScrollTargetOptions = {}) => {
      const navigationId = ++navigationIdRef.current;
      if (queuedFrameRef.current !== null) window.cancelAnimationFrame(queuedFrameRef.current);

      queuedFrameRef.current = window.requestAnimationFrame(() => {
        queuedFrameRef.current = null;
        const target = resolveTarget();
        if (!target?.isConnected) return;
        void scrollNoteEditorTargetIntoView(target).then(() => {
          // 新导航已开始或组件已卸载时不再闪烁，避免旧目标在新导航结束后闪一下
          if (navigationIdRef.current !== navigationId) return;
          const blockId = options.flash ? resolveAnchorHighlightBlockId(target) : null;
          if (blockId) flashBlock(blockId);
        });
      });
    }
  );

  /** 返回是否在文档中命中目标块，调用方据此决定重试或失败提示。 */
  const scrollToAnchor = useMemoizedFn((anchor: NoteEditorAnchor): boolean => {
    if (anchor.kind === 'block') {
      if (!editor.getBlock(anchor.blockId)) return false;
      try {
        editor.setTextCursorPosition(anchor.blockId, 'start');
        editor.focus();
      } catch {
        return false;
      }
      const blockElement = resolveCurrentBlockElement(editor);
      if (!blockElement) return false;
      scrollToTarget(() => blockElement, { flash: true });
      return true;
    }

    scrollToTarget(
      () => findInlineCommentAnchorElement(editor.prosemirrorView.dom, anchor.threadId),
      { flash: true }
    );
    return true;
  });

  return { scrollToAnchor, scrollToTarget };
}
