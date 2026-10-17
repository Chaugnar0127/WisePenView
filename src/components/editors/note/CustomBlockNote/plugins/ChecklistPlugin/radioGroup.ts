import type { Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import { createUuid } from '@/utils/random/createUuid';

import { readGroupId, readInlineChecklistMode } from './model';

export const INLINE_CHECKLIST_PM_TYPE = 'inlineChecklist';

type EditorForRadioGroup = {
  prosemirrorView: EditorView;
  transact: (fn: (tr: Transaction) => void | Transaction) => void;
};

function isInlineChecklistNode(node: { type: { name: string }; attrs: Record<string, unknown> }) {
  return node.type.name === INLINE_CHECKLIST_PM_TYPE;
}

/** 从芯片 DOM 反查 PM 节点位置。 */
export function findInlineChecklistPos(view: EditorView, dom: HTMLElement | null): number | null {
  if (!dom) return null;
  try {
    const pos = view.posAtDOM(dom, 0);
    const direct = view.state.doc.nodeAt(pos);
    if (direct && isInlineChecklistNode(direct)) return pos;
    if (pos > 0) {
      const before = view.state.doc.nodeAt(pos - 1);
      if (before && isInlineChecklistNode(before)) return pos - 1;
    }
  } catch {
    return null;
  }
  return null;
}

/** 同块内、当前位置之前最近的一个 radio 的 groupId（供用户显式「并入上一组」）。 */
export function findPreviousRadioGroupId(view: EditorView, currentPos: number): string | null {
  const $pos = view.state.doc.resolve(currentPos);
  const parent = $pos.parent;
  const parentStart = $pos.start();

  let previousGroupId: string | null = null;
  let offset = 0;
  parent.forEach((child) => {
    const pos = parentStart + offset;
    offset += child.nodeSize;
    if (pos >= currentPos) return;
    if (!isInlineChecklistNode(child)) return;
    if (readInlineChecklistMode(child.attrs.mode) !== 'radio') return;
    const groupId = readGroupId(child.attrs.groupId);
    if (groupId) {
      previousGroupId = groupId;
    }
  });

  return previousGroupId;
}

export function canJoinPreviousRadioGroup(
  view: EditorView,
  currentDom: HTMLElement | null,
  currentGroupId: string
): boolean {
  const currentPos = findInlineChecklistPos(view, currentDom);
  if (currentPos === null) return false;
  const previousGroupId = findPreviousRadioGroupId(view, currentPos);
  if (!previousGroupId) return false;
  return previousGroupId !== currentGroupId;
}

/**
 * 将当前节点设为选中，并取消同 groupId 下其他 radio 的选中。
 * setNodeMarkup 不改变节点尺寸，可在同一事务内安全遍历原坐标。
 */
export function selectRadioInGroup(
  editor: EditorForRadioGroup,
  currentDom: HTMLElement | null,
  attrs: Record<string, unknown>
): void {
  const view = editor.prosemirrorView;
  const currentPos = findInlineChecklistPos(view, currentDom);
  if (currentPos === null) return;

  const groupId = readGroupId(attrs.groupId);
  if (!groupId) {
    editor.transact((tr) => {
      tr.setNodeMarkup(currentPos, undefined, { ...attrs, checked: true });
    });
    return;
  }

  editor.transact((tr) => {
    const { doc } = tr;
    doc.descendants((node, pos) => {
      if (!isInlineChecklistNode(node)) return;
      if (readInlineChecklistMode(node.attrs.mode) !== 'radio') return;
      if (readGroupId(node.attrs.groupId) !== groupId) return;

      if (pos === currentPos) {
        tr.setNodeMarkup(pos, undefined, { ...attrs, checked: true });
        return;
      }
      if (node.attrs.checked === true) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked: false });
      }
    });
  });
}

/**
 * 切换为单选：同块前方已有 radio 组则默认并入，否则新建独立 groupId。
 * 并入时取消当前勾选，避免与上一组已选项冲突。
 */
export function applyRadioMode(
  editor: EditorForRadioGroup,
  currentDom: HTMLElement | null,
  currentAttrs: Record<string, unknown>
): void {
  const view = editor.prosemirrorView;
  const currentPos = findInlineChecklistPos(view, currentDom);
  if (currentPos === null) return;

  const previousGroupId = findPreviousRadioGroupId(view, currentPos);
  const groupId = previousGroupId ?? createUuid();
  const joinedPrevious = Boolean(previousGroupId);

  editor.transact((tr) => {
    tr.setNodeMarkup(currentPos, undefined, {
      ...currentAttrs,
      mode: 'radio',
      groupId,
      checked: joinedPrevious ? false : currentAttrs.checked,
      autoFocus: false,
    });
  });
}

/** 并入同块内上一个单选的组（用户显式操作）。 */
export function joinPreviousRadioGroup(
  editor: EditorForRadioGroup,
  currentDom: HTMLElement | null,
  currentAttrs: Record<string, unknown>
): boolean {
  const view = editor.prosemirrorView;
  const currentPos = findInlineChecklistPos(view, currentDom);
  if (currentPos === null) return false;

  const previousGroupId = findPreviousRadioGroupId(view, currentPos);
  if (!previousGroupId) return false;

  editor.transact((tr) => {
    tr.setNodeMarkup(currentPos, undefined, {
      ...currentAttrs,
      mode: 'radio',
      groupId: previousGroupId,
      // 并入后避免两组同时出现多个勾选：若目标组已有选中，则取消当前项
      checked: false,
      autoFocus: false,
    });
  });
  return true;
}

/** 拆成新组：仅当前项换新 groupId。 */
export function splitRadioGroup(
  editor: EditorForRadioGroup,
  currentDom: HTMLElement | null,
  currentAttrs: Record<string, unknown>
): void {
  const view = editor.prosemirrorView;
  const currentPos = findInlineChecklistPos(view, currentDom);
  if (currentPos === null) return;

  editor.transact((tr) => {
    tr.setNodeMarkup(currentPos, undefined, {
      ...currentAttrs,
      mode: 'radio',
      groupId: createUuid(),
      autoFocus: false,
    });
  });
}

/** 切回多选：清除 groupId。 */
export function applyCheckboxMode(
  editor: EditorForRadioGroup,
  currentDom: HTMLElement | null,
  currentAttrs: Record<string, unknown>
): void {
  const view = editor.prosemirrorView;
  const currentPos = findInlineChecklistPos(view, currentDom);
  if (currentPos === null) return;

  editor.transact((tr) => {
    tr.setNodeMarkup(currentPos, undefined, {
      ...currentAttrs,
      mode: 'checkbox',
      groupId: '',
      autoFocus: false,
    });
  });
}
