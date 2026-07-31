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
   * 执行时机：Note emoji picker 挂载时向 BlockNote SuggestionMenu 注册 `:` 触发字符，卸载时同步注销。
   * 不可替代原因：触发字符注册是 BlockNote extension 的命令式生命周期契约，不能通过渲染派生或用户事件完成。
   * cleanup：移除 `:` 注册，避免编辑器重建或组件卸载后留下重复 suggestion 菜单。
   */
  useEffect(() => {
    suggestionMenu.addSuggestionMenu({
      triggerCharacter: EMOJI_TRIGGER_CHARACTER,
      shouldOpen: (transaction) =>
        !transaction.selection.$from.parent.type.isInGroup('tableContent'),
    });

    return () => suggestionMenu.removeSuggestionMenu(EMOJI_TRIGGER_CHARACTER);
  }, [suggestionMenu]);

  const handleSelect = useMemoizedFn((emojiId: string) => {
    suggestionMenu.closeMenu();
    suggestionMenu.clearQuery();
    editor.insertInlineContent(`${emojiId} `);
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
            suggestionMenu.closeMenu();
          }
        },
        placement: 'bottom-start',
      }}
      elementProps={{ style: { zIndex: 70 } }}
    >
      <EmojiPickerContent onSelect={handleSelect} />
    </GenericPopover>
  );
}

export { NoteEmojiPicker };
