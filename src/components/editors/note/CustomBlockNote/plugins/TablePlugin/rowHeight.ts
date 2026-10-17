import { getNodeById, updateBlock } from '@blocknote/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';

import type { CustomBlockNoteEditor } from '../../registry/noteEditorComposition';

/** `tableRow` 节点上持久化行高的属性名。 */
export const TABLE_ROW_HEIGHT_ATTRIBUTE = 'height';

interface TableNodeInfo {
  tableNode: PMNode;
  /** table 节点在文档中的位置，内容（第一行）从 `tablePos + 1` 开始。 */
  tablePos: number;
}

/** 行高只接受正整数像素值，避免把 NaN、负数或小数写回节点属性。 */
export function normalizeTableRowHeight(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  const height = Math.round(value);
  return height > 0 ? height : null;
}

function findTableNode(doc: PMNode, blockId: string): TableNodeInfo | null {
  const blockInfo = getNodeById(blockId, doc);
  if (!blockInfo) {
    return null;
  }
  const tableNode = blockInfo.node.firstChild;
  if (!tableNode || tableNode.type.name !== 'table') {
    return null;
  }
  return { tableNode, tablePos: blockInfo.posBeforeNode + 1 };
}

function readTableRowHeights(tableNode: PMNode): Array<number | null> {
  const heights: Array<number | null> = [];
  tableNode.forEach((row) => {
    heights.push(normalizeTableRowHeight(row.attrs[TABLE_ROW_HEIGHT_ATTRIBUTE]));
  });
  return heights;
}

/** 从当前文档读取表格每一行的显式高度，未设置的行返回 null。 */
export function collectTableRowHeights(
  editor: CustomBlockNoteEditor,
  blockId: string
): Array<number | null> {
  const table = findTableNode(editor.prosemirrorState.doc, blockId);
  return table ? readTableRowHeights(table.tableNode) : [];
}

/** 读取指定行在文档中的绝对位置，用于挂载拖拽预览装饰。 */
export function findTableRowPosition(
  editor: CustomBlockNoteEditor,
  blockId: string,
  rowIndex: number
): number | null {
  const table = findTableNode(editor.prosemirrorState.doc, blockId);
  if (!table || rowIndex < 0 || rowIndex >= table.tableNode.childCount) {
    return null;
  }
  let offset = 0;
  for (let index = 0; index < rowIndex; index += 1) {
    offset += table.tableNode.child(index).nodeSize;
  }
  return table.tablePos + 1 + offset;
}

function applyTableRowHeights(
  tr: Transaction,
  blockId: string,
  heights: readonly (number | null)[]
): void {
  const table = findTableNode(tr.doc, blockId);
  if (!table) {
    return;
  }

  let rowIndex = 0;
  table.tableNode.forEach((row, offset) => {
    if (rowIndex >= heights.length) {
      return;
    }
    const height = heights[rowIndex];
    if (height !== null) {
      tr.setNodeMarkup(table.tablePos + 1 + offset, undefined, {
        ...row.attrs,
        [TABLE_ROW_HEIGHT_ATTRIBUTE]: height,
      });
    }
    rowIndex += 1;
  });
}

/** 更新单行高度；传 null 恢复为内容自适应高度。 */
export function setTableRowHeight(
  editor: CustomBlockNoteEditor,
  blockId: string,
  rowIndex: number,
  height: number | null
): boolean {
  const normalizedHeight = normalizeTableRowHeight(height);
  return editor.transact((tr) => {
    const table = findTableNode(tr.doc, blockId);
    if (!table) {
      return false;
    }

    let currentIndex = 0;
    let changed = false;
    table.tableNode.forEach((row, offset) => {
      if (changed || currentIndex !== rowIndex) {
        currentIndex += 1;
        return;
      }
      tr.setNodeMarkup(table.tablePos + 1 + offset, undefined, {
        ...row.attrs,
        [TABLE_ROW_HEIGHT_ATTRIBUTE]: normalizedHeight,
      });
      changed = true;
      currentIndex += 1;
    });
    return changed;
  });
}

/**
 * 表格内容更新会重建 tableRow 节点，需在同一事务内把行高按行序写回，
 * 避免切换表头、改颜色或接受 AI 变更时丢失用户调整过的行高。
 */
export function updateTableBlockPreservingRowHeights(
  editor: CustomBlockNoteEditor,
  block: Parameters<CustomBlockNoteEditor['updateBlock']>[0],
  update: Parameters<CustomBlockNoteEditor['updateBlock']>[1]
): ReturnType<CustomBlockNoteEditor['updateBlock']> {
  const blockId = typeof block === 'string' ? block : block.id;
  return editor.transact((tr) => {
    const table = findTableNode(tr.doc, blockId);
    const heights = table ? readTableRowHeights(table.tableNode) : [];
    const updated = updateBlock(tr, block, update);
    if (heights.length > 0) {
      applyTableRowHeights(tr, blockId, heights);
    }
    return updated;
  }) as ReturnType<CustomBlockNoteEditor['updateBlock']>;
}
