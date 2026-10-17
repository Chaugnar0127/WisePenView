import {
  COLOR_KEYS,
  type ColorKey,
} from '@/components/editors/note/CustomBlockNote/ui/editorMenus/colorPaletteData';

export const INLINE_CHECKLIST_MODES = ['checkbox', 'radio'] as const;

export type InlineChecklistMode = (typeof INLINE_CHECKLIST_MODES)[number];

export type InlineChecklistColor = ColorKey;

export interface InlineChecklistProps {
  checked: boolean;
  label: string;
  autoFocus: boolean;
  mode: InlineChecklistMode;
  groupId: string;
  checklistBorderColor: InlineChecklistColor;
  checklistBackgroundColor: InlineChecklistColor;
}

/** 读配色时允许带旧单字段 checklistColor（不在 propSchema 内） */
export type InlineChecklistColorSource = {
  checklistBorderColor?: unknown;
  checklistBackgroundColor?: unknown;
  /** @deprecated 旧单色；新字段为 default 时回退 */
  checklistColor?: unknown;
};

export function isInlineChecklistMode(value: unknown): value is InlineChecklistMode {
  return value === 'checkbox' || value === 'radio';
}

export function readInlineChecklistMode(value: unknown): InlineChecklistMode {
  return isInlineChecklistMode(value) ? value : 'checkbox';
}

export function readChecked(value: unknown): boolean {
  return value === true;
}

export function readLabel(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function readGroupId(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function readChecklistColor(value: unknown): InlineChecklistColor {
  return typeof value === 'string' && (COLOR_KEYS as readonly string[]).includes(value)
    ? (value as InlineChecklistColor)
    : 'default';
}

/** 新字段非 default 优先；否则回退旧单色 checklistColor */
function readColorOrLegacy(primary: unknown, legacy: unknown): InlineChecklistColor {
  const next = readChecklistColor(primary);
  return next !== 'default' ? next : readChecklistColor(legacy);
}

/** Schema 总会注入 default；仍为 default 时回退旧 checklistColor */
export function readChecklistBorderColor(props: InlineChecklistColorSource): InlineChecklistColor {
  return readColorOrLegacy(props.checklistBorderColor, props.checklistColor);
}

export function readChecklistBackgroundColor(
  props: InlineChecklistColorSource
): InlineChecklistColor {
  return readColorOrLegacy(props.checklistBackgroundColor, props.checklistColor);
}
