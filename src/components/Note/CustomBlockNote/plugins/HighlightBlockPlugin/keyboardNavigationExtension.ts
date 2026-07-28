import { createExtension } from '@blocknote/core';

/** 高亮块在正文起点向上导航时，避免光标落入块级结构位置。 */
export const highlightBlockKeyboardNavigationExtension = createExtension({
  key: 'highlightBlockKeyboardNavigation',
  keyboardShortcuts: {
    ArrowUp: ({ editor }) =>
      editor.transact((tr) => {
        const { block, prevBlock } = editor.getTextCursorPosition();
        const isAtBlockStart = tr.selection.empty && tr.selection.$from.parentOffset === 0;
        if (block.type !== 'highlightBlock' || !isAtBlockStart) return false;

        if (prevBlock) editor.setTextCursorPosition(prevBlock, 'end');
        return true;
      }),
  },
});
