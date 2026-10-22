import type { ParagraphChild } from 'docx';
import { ExternalHyperlink, ShadingType, TextRun, UnderlineType } from 'docx';

import { isRecord } from '@/utils/type/typeGuards';

const TEXT_COLORS: Record<string, string> = {
  gray: '9B9A97',
  brown: '64473A',
  red: 'E03E3E',
  orange: 'D9730D',
  yellow: 'DFAB01',
  green: '4D6461',
  blue: '0B6E99',
  purple: '6940A5',
  pink: 'AD1A72',
};

const BACKGROUND_COLORS: Record<string, string> = {
  gray: 'EBECED',
  brown: 'E9E5E3',
  red: 'FBE4E4',
  orange: 'F6E9D9',
  yellow: 'FBF3DB',
  green: 'DDEDEA',
  blue: 'DDEBF1',
  purple: 'EAE4F2',
  pink: 'F4DFEB',
};

function normalizeColor(value: unknown, palette: Record<string, string>): string | undefined {
  if (typeof value !== 'string' || !value || value === 'default') return undefined;
  if (palette[value]) return palette[value];
  const hex = value.replace(/^#/, '').trim();
  return /^[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : undefined;
}

export function resolveNoteBackgroundColor(value: unknown): string | undefined {
  return normalizeColor(value, BACKGROUND_COLORS);
}

export function resolveNoteTextColor(value: unknown): string | undefined {
  return normalizeColor(value, TEXT_COLORS);
}

function readTextRunOptions(styles: unknown) {
  const style = isRecord(styles) ? styles : {};
  const textColor = normalizeColor(style.textColor, TEXT_COLORS);
  const backgroundColor = normalizeColor(style.backgroundColor, BACKGROUND_COLORS);
  return {
    bold: style.bold === true,
    italics: style.italic === true,
    underline: style.underline === true ? { type: UnderlineType.SINGLE } : undefined,
    strike: style.strike === true,
    font: style.code === true ? 'Consolas' : undefined,
    color: textColor,
    shading: backgroundColor
      ? { type: ShadingType.CLEAR, color: 'auto', fill: backgroundColor }
      : undefined,
  };
}

function customInlineToRuns(inline: Record<string, unknown>): ParagraphChild[] {
  if (inline.type === 'inlineMath') {
    const props = isRecord(inline.props) ? inline.props : {};
    const expression = typeof props.expression === 'string' ? props.expression.trim() : '';
    return expression
      ? [new TextRun({ text: `$${expression}$`, font: 'Cambria Math', italics: true })]
      : [];
  }
  return inlineContentToRuns(inline.content);
}

/** 将 BlockNote 行内内容投影为 Word run；未知自定义节点保留其可读文本。 */
export function inlineContentToRuns(content: unknown): ParagraphChild[] {
  if (!Array.isArray(content)) return [];
  const runs: ParagraphChild[] = [];
  for (const inline of content) {
    if (!isRecord(inline)) continue;
    if (inline.type === 'text') {
      const text = typeof inline.text === 'string' ? inline.text : '';
      if (text) runs.push(new TextRun({ text, ...readTextRunOptions(inline.styles) }));
      continue;
    }
    if (inline.type === 'link') {
      const href = typeof inline.href === 'string' ? inline.href : '';
      const children = inlineContentToRuns(inline.content);
      const fallback = href ? [new TextRun({ text: href, style: 'Hyperlink' })] : [];
      runs.push(
        new ExternalHyperlink({
          link: href,
          children: children.length > 0 ? children : fallback,
        })
      );
      continue;
    }
    runs.push(...customInlineToRuns(inline));
  }
  return runs;
}

export function inlineContentToPlainText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((inline) => {
      if (!isRecord(inline)) return '';
      if (typeof inline.text === 'string') return inline.text;
      if (typeof inline.content === 'string') return inline.content;
      if (Array.isArray(inline.content)) return inlineContentToPlainText(inline.content);
      if (inline.type === 'inlineMath' && isRecord(inline.props)) {
        return typeof inline.props.expression === 'string' ? `$${inline.props.expression}$` : '';
      }
      return '';
    })
    .join('');
}
