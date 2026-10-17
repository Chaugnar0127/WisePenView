import type { InlineChecklistColor, InlineChecklistMode } from './model';
import { readChecklistColor } from './model';

/**
 * Markdown 往返：
 * - 多选：`{{cb:文案}}` / `{{cbx:文案}}`
 * - 单选：`{{rb:文案}}` / `{{rbx:文案}}`，可选 `#groupId`
 * - 配色：`{{cb@b:red@g:pink:文案}}`；旧版 `{{cb@red:文案}}` 同时作用边框+背景
 */
export const INLINE_CHECKLIST_MARK_PATTERN =
  /\{\{((?:cbx?)|(?:rbx?))(?:#((?:\\.|[^\\}:@])*))?(?:@b:([a-z]+))?(?:@g:([a-z]+))?(?:@([a-z]+))?:((?:\\.|[^\\}])*)\}\}/g;

export interface InlineChecklistPayload {
  checked: boolean;
  label: string;
  mode: InlineChecklistMode;
  groupId: string;
  borderColor: InlineChecklistColor;
  backgroundColor: InlineChecklistColor;
}

function escapeLabel(label: string): string {
  return label.replace(/\\/g, '\\\\').replace(/\}/g, '\\}').replace(/\n/g, '\\n');
}

function unescapeLabel(label: string): string {
  return label.replace(/\\([\\}n])/g, (_match, ch: string) => (ch === 'n' ? '\n' : ch));
}

function escapeGroupId(groupId: string): string {
  return groupId.replace(/\\/g, '\\\\').replace(/[#:]/g, '\\$&');
}

function unescapeGroupId(groupId: string): string {
  return groupId.replace(/\\([\\#:])/g, '$1');
}

export function encodeInlineChecklistMark(payload: {
  checked: boolean;
  label: string;
  mode?: InlineChecklistMode;
  groupId?: string;
  borderColor?: InlineChecklistColor;
  backgroundColor?: InlineChecklistColor;
  /** @deprecated 旧单色，写入时拆到边框+背景 */
  color?: InlineChecklistColor;
}): string {
  const mode = payload.mode ?? 'checkbox';
  const kind = mode === 'radio' ? (payload.checked ? 'rbx' : 'rb') : payload.checked ? 'cbx' : 'cb';
  const group = mode === 'radio' && payload.groupId ? `#${escapeGroupId(payload.groupId)}` : '';
  const legacy = readChecklistColor(payload.color);
  const borderColor = readChecklistColor(payload.borderColor ?? legacy);
  const backgroundColor = readChecklistColor(payload.backgroundColor ?? legacy);
  const borderMark = borderColor !== 'default' ? `@b:${borderColor}` : '';
  const backgroundMark = backgroundColor !== 'default' ? `@g:${backgroundColor}` : '';
  return `{{${kind}${group}${borderMark}${backgroundMark}:${escapeLabel(payload.label)}}}`;
}

export function parseInlineChecklistMark(
  mark: string,
  rawLabel: string,
  rawGroupId?: string,
  rawBorderColor?: string,
  rawBackgroundColor?: string,
  rawLegacyColor?: string
): InlineChecklistPayload | undefined {
  const isRadio = mark === 'rb' || mark === 'rbx';
  const isCheckbox = mark === 'cb' || mark === 'cbx';
  if (!isRadio && !isCheckbox) return undefined;

  const checked = mark === 'cbx' || mark === 'rbx';
  const legacy = readChecklistColor(rawLegacyColor);
  return {
    checked,
    label: unescapeLabel(rawLabel),
    mode: isRadio ? 'radio' : 'checkbox',
    groupId: rawGroupId ? unescapeGroupId(rawGroupId) : '',
    borderColor: rawBorderColor ? readChecklistColor(rawBorderColor) : legacy,
    backgroundColor: rawBackgroundColor ? readChecklistColor(rawBackgroundColor) : legacy,
  };
}

function escapeTokenPart(value: string): string {
  return value.replace(/\|/g, '||');
}

function unescapeTokenPart(value: string): string {
  return value.replace(/\|\|/g, '|');
}

/**
 * Token 载荷：
 * - 旧：`0文案` / `1文案`
 * - 多选：`c0|border|bg|label` 或旧 `c0|color|label`
 * - 单选：`r1|groupId|border|bg|label` 或旧 `r1|groupId|color|label`
 */
export function encodeInlineChecklistToken(payload: InlineChecklistPayload): string {
  const borderColor = readChecklistColor(payload.borderColor);
  const backgroundColor = readChecklistColor(payload.backgroundColor);
  if (payload.mode === 'radio') {
    return `r${payload.checked ? '1' : '0'}|${escapeTokenPart(payload.groupId)}|${borderColor}|${backgroundColor}|${payload.label}`;
  }
  if (borderColor !== 'default' || backgroundColor !== 'default') {
    return `c${payload.checked ? '1' : '0'}|${borderColor}|${backgroundColor}|${payload.label}`;
  }
  return `${payload.checked ? '1' : '0'}${payload.label}`;
}

function splitColorAndLabel(body: string): {
  borderColor: InlineChecklistColor;
  backgroundColor: InlineChecklistColor;
  label: string;
} {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === '|' && body[i + 1] === '|') {
      current += '|';
      i += 1;
      continue;
    }
    if (body[i] === '|') {
      parts.push(current);
      current = '';
      continue;
    }
    current += body[i];
  }
  parts.push(current);

  if (parts.length >= 3) {
    return {
      borderColor: readChecklistColor(parts[0]),
      backgroundColor: readChecklistColor(parts[1]),
      label: parts.slice(2).join('|'),
    };
  }
  if (parts.length === 2) {
    const legacy = readChecklistColor(parts[0]);
    return {
      borderColor: legacy,
      backgroundColor: legacy,
      label: parts[1],
    };
  }
  return {
    borderColor: 'default',
    backgroundColor: 'default',
    label: parts[0] ?? '',
  };
}

export function parseInlineChecklistToken(value: string): InlineChecklistPayload | undefined {
  if (value.length < 1) return undefined;

  if (value[0] === 'r' || value[0] === 'c') {
    const checkedFlag = value[1];
    if (checkedFlag !== '0' && checkedFlag !== '1') return undefined;
    const rest = value.slice(2);
    if (!rest.startsWith('|')) return undefined;

    if (value[0] === 'c') {
      const parsed = splitColorAndLabel(rest.slice(1));
      return {
        checked: checkedFlag === '1',
        label: parsed.label,
        mode: 'checkbox',
        groupId: '',
        borderColor: parsed.borderColor,
        backgroundColor: parsed.backgroundColor,
      };
    }

    const body = rest.slice(1);
    const firstSep = body.indexOf('|');
    if (firstSep < 0) return undefined;
    const groupId = unescapeTokenPart(body.slice(0, firstSep));
    const parsed = splitColorAndLabel(body.slice(firstSep + 1));
    return {
      checked: checkedFlag === '1',
      label: parsed.label,
      mode: 'radio',
      groupId,
      borderColor: parsed.borderColor,
      backgroundColor: parsed.backgroundColor,
    };
  }

  const flag = value[0];
  if (flag !== '0' && flag !== '1') return undefined;
  return {
    checked: flag === '1',
    label: value.slice(1),
    mode: 'checkbox',
    groupId: '',
    borderColor: 'default',
    backgroundColor: 'default',
  };
}
