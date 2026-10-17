import { isTableCellSelection } from '@blocknote/core';
import { FormattingToolbarExtension } from '@blocknote/core/extensions';
import { useBlockNoteEditor, useEditorState, useExtension } from '@blocknote/react';
import { SquareCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  blockNoteSchema,
  type CustomBlockNoteEditor,
} from '@/components/editors/note/CustomBlockNote/registry/noteEditorComposition';

import { blockHasInlineContent, getSelectedBlocks } from '../utils';
import { type ButtonGroupChildProps, ToolbarButton } from './ToolbarButton';

type InlineContentInsert = Parameters<CustomBlockNoteEditor['insertInlineContent']>[0];

/**
 * 将当前选区文本替换为行内任务（inlineChecklist），交互与「添加链接」并列。
 */
export function ConvertToTaskToolbarButton(buttonGroupProps: ButtonGroupChildProps) {
  const { t } = useTranslation('note');
  const editor = useBlockNoteEditor(blockNoteSchema);
  const formattingToolbar = useExtension(FormattingToolbarExtension);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (
        !editor.isEditable ||
        !('inlineChecklist' in editor.schema.inlineContentSchema) ||
        isTableCellSelection(editor.prosemirrorState.selection) ||
        !getSelectedBlocks(editor).find(blockHasInlineContent)
      ) {
        return undefined;
      }

      const text = editor.getSelectedText();
      if (!text.trim()) {
        return undefined;
      }

      return { text };
    },
  });

  if (!state) {
    return null;
  }

  const convertSelectionToTask = () => {
    const content = [
      {
        type: 'inlineChecklist',
        props: {
          checked: false,
          label: state.text,
          autoFocus: false,
        },
      },
    ] as unknown as InlineContentInsert;

    editor.insertInlineContent(content, { updateSelection: true });
    formattingToolbar.store.setState(false);
    window.setTimeout(() => editor.focus());
  };

  return (
    <ToolbarButton
      {...buttonGroupProps}
      label={t('editor.inlineChecklist.convert')}
      icon={<SquareCheck size={20} />}
      onPress={convertSelectionToTask}
    />
  );
}
