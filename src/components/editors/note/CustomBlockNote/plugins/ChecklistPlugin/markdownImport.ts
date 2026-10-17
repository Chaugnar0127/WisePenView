import { createUuid } from '@/utils/random/createUuid';

import type { NoteMarkdownImportContext, NoteMarkdownInlineImport } from '../../registry/types';
import {
  encodeInlineChecklistToken,
  INLINE_CHECKLIST_MARK_PATTERN,
  parseInlineChecklistMark,
  parseInlineChecklistToken,
} from './markdownMarkers';

interface MarkdownFence {
  marker: '`' | '~';
  length: number;
}

function parseFenceOpening(line: string): MarkdownFence | null {
  const match = /^ {0,3}(`{3,}|~{3,})/.exec(line);
  if (!match) return null;
  return {
    marker: match[1][0] as MarkdownFence['marker'],
    length: match[1].length,
  };
}

function isFenceClosing(line: string, fence: MarkdownFence): boolean {
  const match = /^ {0,3}(`+|~+)\s*$/.exec(line);
  return Boolean(match && match[1][0] === fence.marker && match[1].length >= fence.length);
}

function prepareInlineChecklistLine(line: string, context: NoteMarkdownImportContext): string {
  INLINE_CHECKLIST_MARK_PATTERN.lastIndex = 0;

  return line.replace(
    INLINE_CHECKLIST_MARK_PATTERN,
    (
      match,
      mark: string,
      rawGroupId: string | undefined,
      rawBorderColor: string | undefined,
      rawBackgroundColor: string | undefined,
      rawLegacyColor: string | undefined,
      rawLabel: string
    ) => {
      const payload = parseInlineChecklistMark(
        mark,
        rawLabel,
        rawGroupId,
        rawBorderColor,
        rawBackgroundColor,
        rawLegacyColor
      );
      if (!payload) return match;

      // 无显式 #groupId 时各自独立成组，避免默认「整行/整块绑一组」
      if (payload.mode === 'radio' && !payload.groupId) {
        payload.groupId = createUuid();
      }

      return context.createToken(encodeInlineChecklistToken(payload));
    }
  );
}

function prepareInlineChecklist(markdown: string, context: NoteMarkdownImportContext): string {
  const lines = markdown.split('\n');
  let codeFence: MarkdownFence | null = null;

  return lines
    .map((line) => {
      if (codeFence) {
        if (isFenceClosing(line, codeFence)) codeFence = null;
        return line;
      }

      const opening = parseFenceOpening(line);
      if (opening) {
        codeFence = opening;
        return line;
      }
      if (/^(?: {4}|\t)/.test(line)) return line;
      return prepareInlineChecklistLine(line, context);
    })
    .join('\n');
}

export const inlineChecklistMarkdownImport: NoteMarkdownInlineImport = {
  prepare: prepareInlineChecklist,
  restore(inline, context) {
    if (inline.type !== 'text' || typeof inline.text !== 'string') return undefined;
    const styles = typeof inline.styles === 'object' && inline.styles !== null ? inline.styles : {};
    if ((styles as Record<string, unknown>).code === true) return undefined;

    const segments = context.splitTokens(inline.text);
    if (!segments.some((segment) => segment.type === 'token')) return undefined;

    const restored: Record<string, unknown>[] = [];

    for (const segment of segments) {
      if (segment.type === 'text') {
        if (segment.text) {
          restored.push({ type: 'text', text: segment.text, styles });
        }
        continue;
      }
      const payload = parseInlineChecklistToken(segment.value);
      if (!payload) {
        restored.push({ type: 'text', text: segment.value, styles });
        continue;
      }

      const groupId = payload.mode === 'radio' ? payload.groupId || createUuid() : '';

      restored.push({
        type: 'inlineChecklist',
        props: {
          checked: payload.checked,
          label: payload.label,
          autoFocus: false,
          mode: payload.mode,
          groupId,
          checklistBorderColor: payload.borderColor,
          checklistBackgroundColor: payload.backgroundColor,
        },
      });
    }
    return restored;
  },
};
