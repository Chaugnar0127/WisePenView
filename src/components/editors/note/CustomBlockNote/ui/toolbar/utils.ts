import type { MouseEvent as ReactMouseEvent } from 'react';

import type { CustomBlockNoteEditor } from '../../registry/noteEditorComposition';
import type { NoteBlock } from '../editorMenus/utils';
export {
  isRecord,
  type NoteBlock,
  type NoteBlockUpdate,
  toBlockUpdate,
} from '../editorMenus/utils';

type NoteStyleUpdate = Parameters<CustomBlockNoteEditor['addStyles']>[0];

export function stopToolbarMouseDown(event: ReactMouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function blockHasInlineContent(block: NoteBlock): boolean {
  return block.content !== undefined;
}

export function getSelectedBlocks(editor: CustomBlockNoteEditor): NoteBlock[] {
  try {
    return editor.getSelection()?.blocks ?? [editor.getTextCursorPosition().block];
  } catch {
    return [];
  }
}

function getSchemaStyleRecord(editor: CustomBlockNoteEditor) {
  return editor.schema.styleSchema as Record<string, { type?: unknown; propSchema?: unknown }>;
}

function styleExists(
  editor: CustomBlockNoteEditor,
  style: string,
  propSchema: 'boolean' | 'string'
): boolean {
  const schemaStyle = getSchemaStyleRecord(editor)[style];
  return schemaStyle?.type === style && schemaStyle.propSchema === propSchema;
}

export function basicStyleExists(editor: CustomBlockNoteEditor, style: string): boolean {
  return styleExists(editor, style, 'boolean');
}

/** 带取值（如颜色、字号、字体）的样式：选项需要读写 mark 上的 stringValue。 */
export function stringStyleExists(editor: CustomBlockNoteEditor, style: string): boolean {
  return styleExists(editor, style, 'string');
}

export function toStyleUpdate(style: Record<string, string | boolean>): NoteStyleUpdate {
  // 样式由插件在运行时注册，schema 的 Styles 类型只能拿到默认样式键，
  // 因此这里把插件样式键按运行时校验的事实交给 BlockNote。
  return style as unknown as NoteStyleUpdate;
}
