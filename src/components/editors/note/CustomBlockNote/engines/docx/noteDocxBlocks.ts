import {
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import { isRecord } from '@/utils/type/typeGuards';

import { renderNoteMermaidDiagram } from '../../plugins/MermaidPlugin/mermaidRuntime';
import { readMermaidSource } from '../../plugins/MermaidPlugin/source';
import {
  inlineContentToPlainText,
  inlineContentToRuns,
  resolveNoteBackgroundColor,
  resolveNoteTextColor,
} from './noteDocxInline';
import { loadDocxImageFromSvg, loadDocxImageFromUrl, type NoteDocxImage } from './noteDocxMedia';

const BULLET_NUMBERING_REFERENCE = 'note-docx-bullet';
const DECIMAL_NUMBERING_REFERENCE = 'note-docx-number';
const MAX_LIST_LEVEL = 8;
const BORDER_COLOR = 'D9D9D9';

export interface NoteDocxRenderContext {
  imageCache: Map<string, Promise<NoteDocxImage | undefined>>;
}

function readProps(block: Record<string, unknown>): Record<string, unknown> {
  return isRecord(block.props) ? block.props : {};
}

function readStringProp(props: Record<string, unknown>, key: string): string {
  return typeof props[key] === 'string' ? props[key] : '';
}

function readNumberProp(props: Record<string, unknown>, key: string): number | undefined {
  const value = props[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readAlignment(value: unknown) {
  switch (value) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function readChildren(block: Record<string, unknown>): unknown[] {
  return Array.isArray(block.children) ? block.children : [];
}

function clampListLevel(depth: number): number {
  return Math.min(MAX_LIST_LEVEL, Math.max(0, depth));
}

async function loadImage(
  url: string,
  previewWidth: number | undefined,
  context: NoteDocxRenderContext
) {
  const cacheKey = `${url}\u0000${previewWidth ?? ''}`;
  let pending = context.imageCache.get(cacheKey);
  if (!pending) {
    pending = loadDocxImageFromUrl(url, previewWidth);
    context.imageCache.set(cacheKey, pending);
  }
  return pending;
}

function createImageParagraph(image: NoteDocxImage, alignment = AlignmentType.CENTER): Paragraph {
  return new Paragraph({
    alignment,
    spacing: { before: 120, after: 120 },
    children: [
      new ImageRun({
        data: image.data,
        type: image.type,
        transformation: { width: image.width, height: image.height },
      }),
    ],
  });
}

function createLinkParagraph(label: string, url: string): Paragraph {
  const text = label.trim() || url;
  return new Paragraph({
    children: [
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text, style: 'Hyperlink' })],
      }),
    ],
  });
}

async function renderImageBlock(
  block: Record<string, unknown>,
  context: NoteDocxRenderContext
): Promise<Paragraph[]> {
  const props = readProps(block);
  const url = readStringProp(props, 'url');
  const caption = readStringProp(props, 'caption');
  const name = readStringProp(props, 'name');
  const image = url
    ? await loadImage(url, readNumberProp(props, 'previewWidth'), context)
    : undefined;
  if (image) {
    return [
      createImageParagraph(image),
      ...(caption
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: caption, color: '6B7280', size: 18 })],
            }),
          ]
        : []),
    ];
  }
  return url ? [createLinkParagraph(caption || name, url)] : [];
}

async function renderMermaidBlock(block: Record<string, unknown>): Promise<Paragraph[]> {
  const source = readMermaidSource(block.content).trim();
  if (!source) return [];
  try {
    const diagramId = `note-docx-${String(block.id ?? 'diagram')}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const svg = await renderNoteMermaidDiagram(diagramId, source);
    const image = await loadDocxImageFromSvg(svg);
    if (image) return [createImageParagraph(image)];
  } catch {
    // 图形渲染失败时保留源码，至少不丢失内容。
  }
  return [createCodeParagraph(source, 'mermaid')];
}

function createCodeParagraph(source: string, language?: string): Paragraph {
  const lines = source.replace(/\n$/, '').split('\n');
  const children = lines.map(
    (line, index) =>
      new TextRun({ text: line, break: index === 0 ? 0 : 1, font: 'Consolas', size: 18 })
  );
  return new Paragraph({
    keepLines: true,
    spacing: { before: 100, after: 140, line: 260 },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F6F8FA' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    },
    children: [
      ...(language && language !== 'text'
        ? [new TextRun({ text: `${language}\n`, font: 'Consolas', size: 16, color: '6B7280' })]
        : []),
      ...(children.length > 0 ? children : [new TextRun({ text: '' })]),
    ],
  });
}

function createTable(block: Record<string, unknown>): Table[] {
  const content = isRecord(block.content) ? block.content : {};
  const rows = Array.isArray(content.rows) ? content.rows : [];
  const headerRows = readNumberProp(content, 'headerRows') ?? 0;
  const headerCols = readNumberProp(content, 'headerCols') ?? 0;
  const tableRows = rows.map((row, rowIndex) => {
    const cells = isRecord(row) && Array.isArray(row.cells) ? row.cells : [];
    const tableCells = cells.map((cell, colIndex) => {
      const cellRecord = isRecord(cell) ? cell : {};
      const cellProps = isRecord(cellRecord.props) ? cellRecord.props : {};
      const cellContent = Array.isArray(cellRecord.content)
        ? cellRecord.content
        : Array.isArray(cell)
          ? cell
          : [];
      const isHeader = rowIndex < headerRows || colIndex < headerCols;
      return new TableCell({
        columnSpan: readNumberProp(cellProps, 'colspan'),
        rowSpan: readNumberProp(cellProps, 'rowspan'),
        shading: isHeader ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' } : undefined,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            run: isHeader ? { bold: true } : undefined,
            children: inlineContentToRuns(cellContent),
            alignment: readAlignment(cellProps.textAlignment),
          }),
        ],
      });
    });
    return new TableRow({
      tableHeader: rowIndex < headerRows,
      cantSplit: true,
      children:
        tableCells.length > 0 ? tableCells : [new TableCell({ children: [new Paragraph('')] })],
    });
  });
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      },
    }),
  ];
}

function createCallout(block: Record<string, unknown>): Table {
  const props = readProps(block);
  const background = resolveNoteBackgroundColor(props.highlightBackgroundColor) ?? 'FFF8E1';
  const border = resolveNoteTextColor(props.highlightBorderColor) ?? 'F0C36D';
  const icon = readStringProp(props, 'icon') || '💡';
  const runs = inlineContentToRuns(block.content);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: border },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: border },
      left: { style: BorderStyle.SINGLE, size: 8, color: border },
      right: { style: BorderStyle.SINGLE, size: 8, color: border },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: background },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                alignment: readAlignment(props.textAlignment),
                children: [new TextRun({ text: `${icon} ` }), ...runs],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createListParagraph(
  block: Record<string, unknown>,
  depth: number,
  kind: 'bullet' | 'check' | 'decimal' | 'toggle'
): Paragraph {
  const props = readProps(block);
  const level = clampListLevel(depth);
  const runs = inlineContentToRuns(block.content);
  if (kind === 'bullet' || kind === 'decimal') {
    return new Paragraph({
      numbering: {
        reference: kind === 'bullet' ? BULLET_NUMBERING_REFERENCE : DECIMAL_NUMBERING_REFERENCE,
        level,
      },
      children: runs,
    });
  }
  const prefix = kind === 'check' ? (props.checked === true ? '☑ ' : '☐ ') : '▸ ';
  return new Paragraph({
    indent: { left: 360 + level * 360, hanging: 240 },
    children: [new TextRun({ text: prefix }), ...runs],
  });
}

function createTextBlock(block: Record<string, unknown>, type: string, depth: number): Paragraph[] {
  const props = readProps(block);
  const runs = inlineContentToRuns(block.content);
  const alignment = readAlignment(props.textAlignment);
  const backgroundColor = resolveNoteBackgroundColor(props.backgroundColor);
  if (type === 'heading') {
    const level = Math.min(6, Math.max(1, readNumberProp(props, 'level') ?? 1));
    const headingLevels = [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ] as const;
    return [new Paragraph({ heading: headingLevels[level - 1], alignment, children: runs })];
  }
  if (type === 'quote') {
    return [
      new Paragraph({
        alignment,
        indent: { left: 360 + depth * 240 },
        spacing: { before: 100, after: 140 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'A3A3A3' } },
        children: runs,
      }),
    ];
  }
  if (type === 'codeBlock') {
    return [
      createCodeParagraph(
        inlineContentToPlainText(block.content),
        readStringProp(props, 'language')
      ),
    ];
  }
  if (type === 'math') {
    const expression = readStringProp(props, 'expression').trim();
    return expression
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 160 },
            children: [
              new TextRun({ text: expression, font: 'Cambria Math', italics: true, size: 22 }),
            ],
          }),
        ]
      : [];
  }
  if (type === 'divider') {
    return [
      new Paragraph({
        spacing: { before: 100, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR } },
      }),
    ];
  }
  return [
    new Paragraph({
      alignment,
      indent: depth > 0 ? { left: depth * 240 } : undefined,
      shading: backgroundColor
        ? {
            type: ShadingType.CLEAR,
            color: 'auto',
            fill: backgroundColor,
          }
        : undefined,
      children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
    }),
  ];
}

async function renderBlock(
  block: Record<string, unknown>,
  context: NoteDocxRenderContext,
  depth: number
): Promise<(Paragraph | Table)[]> {
  const type = typeof block.type === 'string' ? block.type : '';
  const children = readChildren(block);
  const childDepth = type.endsWith('ListItem') ? depth + 1 : depth;
  let own: (Paragraph | Table)[] = [];
  switch (type) {
    case 'bulletListItem':
      own = [createListParagraph(block, depth, 'bullet')];
      break;
    case 'numberedListItem':
      own = [createListParagraph(block, depth, 'decimal')];
      break;
    case 'checkListItem':
      own = [createListParagraph(block, depth, 'check')];
      break;
    case 'toggleListItem':
      own = [createListParagraph(block, depth, 'toggle')];
      break;
    case 'highlightBlock':
      own = [createCallout(block)];
      break;
    case 'table':
      own = createTable(block);
      break;
    case 'image':
      own = await renderImageBlock(block, context);
      break;
    case 'mermaid':
      own = await renderMermaidBlock(block);
      break;
    case 'video':
    case 'audio':
    case 'file': {
      const props = readProps(block);
      const url = readStringProp(props, 'url');
      const label = readStringProp(props, 'caption') || readStringProp(props, 'name') || url;
      own = url ? [createLinkParagraph(label, url)] : [];
      break;
    }
    default:
      own = createTextBlock(block, type, depth);
  }
  const nested = await renderNoteDocxBlocks(children, context, childDepth);
  return [...own, ...nested];
}

/** 将投影后的 BlockNote 文档转换为 Word 块级内容。 */
export async function renderNoteDocxBlocks(
  blocks: readonly unknown[],
  context: NoteDocxRenderContext,
  depth = 0
): Promise<(Paragraph | Table)[]> {
  const output: (Paragraph | Table)[] = [];
  for (const block of blocks) {
    if (!isRecord(block)) continue;
    output.push(...(await renderBlock(block, context, depth)));
  }
  return output;
}

export const NOTE_DOCX_NUMBERING = [
  {
    reference: BULLET_NUMBERING_REFERENCE,
    levels: Array.from({ length: MAX_LIST_LEVEL + 1 }, (_, level) => ({
      level,
      format: LevelFormat.BULLET,
      text: level % 2 === 0 ? '•' : '◦',
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360 + level * 360, hanging: 240 } } },
    })),
  },
  {
    reference: DECIMAL_NUMBERING_REFERENCE,
    levels: Array.from({ length: MAX_LIST_LEVEL + 1 }, (_, level) => ({
      level,
      format: LevelFormat.DECIMAL,
      text: `%${level + 1}.`,
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360 + level * 360, hanging: 240 } } },
    })),
  },
];
