import { isRecord } from '@/utils/type/typeGuards';

import { collectNodeAttributeTextMatches } from '../../engines/search/findReplace';
import type { NoteInlinePlugin, NotePluginBundle } from '../../registry/types';
import { inlineChecklistAiDiff } from './aiDiff';
import { inlineChecklistContentSpec } from './InlineChecklist';
import { inlineChecklistMarkdownImport } from './markdownImport';
import { readChecked, readInlineChecklistMode, readLabel } from './model';

function readInlineProps(inline: Record<string, unknown>): Record<string, unknown> {
  return isRecord(inline.props) ? inline.props : {};
}

function formatInlineChecklistText(mark: string, label: string): string {
  return label ? `${mark} ${label}` : mark;
}

function resolvePlainMark(inline: Record<string, unknown>): string {
  const props = readInlineProps(inline);
  const checked = readChecked(props.checked);
  const mode = readInlineChecklistMode(props.mode);
  if (mode === 'radio') {
    return checked ? '(x)' : '( )';
  }
  return checked ? '[x]' : '[ ]';
}

const inlineChecklistPlugin = {
  kind: 'inline',
  id: 'checklist.inline.inlineChecklist',
  type: 'inlineChecklist',
  spec: inlineChecklistContentSpec,
  capabilities: {
    markdownImport: { support: 'custom' },
    markdownExport: { support: 'custom' },
    aiDiff: { support: 'custom' },
    plainText: { support: 'custom' },
    findReplace: { support: 'custom' },
    print: { support: 'default' },
  },
  selection: {
    inspect: (inline, context) => {
      if (context.selectedText) {
        return { selected: context.selected, text: context.selectedText };
      }
      const props = readInlineProps(inline);
      return {
        selected: context.selected,
        text: formatInlineChecklistText(resolvePlainMark(inline), readLabel(props.label)),
      };
    },
  },
  plainText: {
    project: (inline) => {
      const props = readInlineProps(inline);
      return formatInlineChecklistText(resolvePlainMark(inline), readLabel(props.label));
    },
  },
  findReplace: {
    collectMatches: ({ node, pos, query }) =>
      collectNodeAttributeTextMatches(
        node,
        pos,
        'label',
        query,
        'checklist.inline.inlineChecklist'
      ),
  },
  markdownImport: inlineChecklistMarkdownImport,
  markdownExport: { project: (inline) => inline },
  aiDiff: inlineChecklistAiDiff,
} satisfies NoteInlinePlugin;

/** 行内勾选插件；块级任务列表仍由 DefaultContentPlugin 的 checkListItem 提供。 */
export const checklistPlugin = {
  kind: 'bundle',
  id: 'checklist',
  children: [inlineChecklistPlugin],
} satisfies NotePluginBundle;
