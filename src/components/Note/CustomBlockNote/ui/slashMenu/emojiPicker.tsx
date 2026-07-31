import { EmojiPickerContent } from '@/components/EmojiPicker';
import { SuggestionMenu } from '@blocknote/core/extensions';
import {
  GenericPopover,
  useBlockNoteEditor,
  useExtension,
  useExtensionState,
  type GenericPopoverReference,
} from '@blocknote/react';
import { useMemoizedFn } from 'ahooks';
import { useEffect } from 'react';

const EMOJI_TRIGGER_CHARACTER = ':';
const EMOJI_PICKER_FLOATING_OFFSET = 10;
const EMOJI_PICKER_VIEWPORT_PADDING = 10;

function clampFloatingPosition(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function NoteEmojiPicker() {
  const editor = useBlockNoteEditor();
  const suggestionMenu = useExtension(SuggestionMenu);
  const state = useExtensionState(SuggestionMenu);
  const reference = useExtensionState(SuggestionMenu, {
    selector: (menuState) =>
      ({
        element: (editor.domElement?.firstChild || undefined) as Element | undefined,
        getBoundingClientRect: () => menuState?.referencePos ?? new DOMRect(),
      }) satisfies GenericPopoverReference,
  });

  /**
   * @wisepen-manual-effect
   * 执行时机：Note emoji picker 挂载时向 BlockNote SuggestionMenu 注册 `:` 菜单，卸载时同步注销。
   * 不可替代原因：`/emoji` 默认项会通过 BlockNote extension 命令式打开 `:` 菜单，必须先完成注册。
   * cleanup：移除 `:` 注册，避免编辑器重建或组件卸载后留下重复 suggestion 菜单。
   */
  useEffect(() => {
    suggestionMenu.addSuggestionMenu({
      triggerCharacter: EMOJI_TRIGGER_CHARACTER,
      shouldOpen: () => false,
    });

    return () => suggestionMenu.removeSuggestionMenu(EMOJI_TRIGGER_CHARACTER);
  }, [suggestionMenu]);

  const handleSelect = useMemoizedFn((emojiId: string) => {
    suggestionMenu.clearQuery();
    suggestionMenu.closeMenu();
    editor.focus();
    editor.insertInlineContent(emojiId);
  });

  if (
    !state ||
    state.triggerCharacter !== EMOJI_TRIGGER_CHARACTER ||
    (!state.ignoreQueryLength && (state.query.startsWith(' ') || state.query.length < 2))
  ) {
    return null;
  }

  return (
    <GenericPopover
      reference={reference}
      focusManagerProps={{ disabled: true }}
      useFloatingOptions={{
        open: state.show,
        onOpenChange: (open) => {
          if (!open) {
            suggestionMenu.clearQuery();
            suggestionMenu.closeMenu();
          }
        },
        placement: 'bottom-start',
        middleware: [
          {
            name: 'noteEmojiPickerPlacement',
            fn({ x, rects, elements }) {
              const referenceRect = elements.reference.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const bottomY = referenceRect.bottom + EMOJI_PICKER_FLOATING_OFFSET;
              const topY = referenceRect.top - EMOJI_PICKER_FLOATING_OFFSET - rects.floating.height;
              const bottomOverflows =
                bottomY + rects.floating.height > viewportHeight - EMOJI_PICKER_VIEWPORT_PADDING;
              const preferredY = bottomOverflows ? topY : bottomY;
              const maxX = viewportWidth - EMOJI_PICKER_VIEWPORT_PADDING - rects.floating.width;
              const maxY = viewportHeight - EMOJI_PICKER_VIEWPORT_PADDING - rects.floating.height;

              return {
                x: clampFloatingPosition(x, EMOJI_PICKER_VIEWPORT_PADDING, maxX),
                y: clampFloatingPosition(preferredY, EMOJI_PICKER_VIEWPORT_PADDING, maxY),
              };
            },
          },
        ],
      }}
      elementProps={{
        onMouseDownCapture: (event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest('input, textarea, [contenteditable="true"]')
          ) {
            return;
          }
          event.preventDefault();
        },
        style: { zIndex: 70 },
      }}
    >
      <EmojiPickerContent onSelect={handleSelect} />
    </GenericPopover>
  );
}

export { NoteEmojiPicker };
