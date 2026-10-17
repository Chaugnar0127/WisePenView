import { createExtension } from '@blocknote/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';

export interface TableRowResizePreview {
  /** tableRow 节点在文档中的绝对位置。 */
  pos: number;
  height: number;
}

export const tableRowResizePreviewPluginKey = new PluginKey<TableRowResizePreview | null>(
  'note-table-row-resize-preview'
);

function createTableRowResizePreviewPlugin() {
  return new Plugin<TableRowResizePreview | null>({
    key: tableRowResizePreviewPluginKey,
    state: {
      init: () => null,
      apply(tr, preview) {
        const nextPreview = tr.getMeta(tableRowResizePreviewPluginKey);
        if (nextPreview !== undefined) {
          return nextPreview as TableRowResizePreview | null;
        }
        // 文档变化说明预览已经结束，避免装饰继续覆盖新的行高。
        return tr.docChanged ? null : preview;
      },
    },
    props: {
      decorations(state) {
        const preview = tableRowResizePreviewPluginKey.getState(state);
        if (!preview) {
          return null;
        }
        const row = state.doc.nodeAt(preview.pos);
        if (!row || row.type.name !== 'tableRow') {
          return null;
        }
        return DecorationSet.create(state.doc, [
          Decoration.node(preview.pos, preview.pos + row.nodeSize, {
            'data-note-row-resizing': 'true',
            style: `--note-table-row-preview-height:${preview.height}px`,
          }),
        ]);
      },
    },
  });
}

/** 实时预览挂在 ProseMirror 装饰上，避免直接改 DOM 被视图同步逻辑覆盖。 */
export function createTableRowResizePreviewExtension() {
  return createExtension({
    key: 'note-table-row-resize-preview',
    prosemirrorPlugins: [createTableRowResizePreviewPlugin()],
  });
}

export function setTableRowResizePreview(view: EditorView, pos: number, height: number): void {
  const current = tableRowResizePreviewPluginKey.getState(view.state);
  if (current?.pos === pos && current.height === height) {
    return;
  }
  view.dispatch(view.state.tr.setMeta(tableRowResizePreviewPluginKey, { pos, height }));
}

export function clearTableRowResizePreview(view: EditorView): void {
  if (!tableRowResizePreviewPluginKey.getState(view.state)) {
    return;
  }
  view.dispatch(view.state.tr.setMeta(tableRowResizePreviewPluginKey, null));
}
