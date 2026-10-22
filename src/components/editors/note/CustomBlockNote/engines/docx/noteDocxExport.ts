import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

import { AI_DIFF_DISPLAY_MODE } from '@/domains/Note';
import i18n from '@/i18n';

import type { CustomBlockNoteEditor } from '../../registry/noteEditorComposition';
import type { NotePluginRegistry } from '../../registry/types';
import { readAiContentFromEditorState } from '../aiDiff/extension';
import { projectNoteBlocksForExport } from '../export/noteExportProjection';
import { NOTE_DOCX_NUMBERING, renderNoteDocxBlocks } from './noteDocxBlocks';

export interface NoteDocxExportOptions {
  title?: string;
}

function createDocumentStyles() {
  return {
    default: {
      document: {
        run: { font: 'Arial', size: 22, color: '1F2937' },
        paragraph: { spacing: { after: 100, line: 300 } },
      },
      title: {
        run: { font: 'Arial', size: 36, bold: true, color: '111827' },
        paragraph: { spacing: { after: 260 } },
      },
      heading1: {
        run: { font: 'Arial', size: 30, bold: true, color: '111827' },
        paragraph: { spacing: { before: 260, after: 120 }, keepNext: true },
      },
      heading2: {
        run: { font: 'Arial', size: 26, bold: true, color: '111827' },
        paragraph: { spacing: { before: 220, after: 100 }, keepNext: true },
      },
      heading3: {
        run: { font: 'Arial', size: 23, bold: true, color: '111827' },
        paragraph: { spacing: { before: 200, after: 80 }, keepNext: true },
      },
      heading4: {
        run: { font: 'Arial', size: 22, bold: true, color: '111827' },
        paragraph: { spacing: { before: 180, after: 80 }, keepNext: true },
      },
      heading5: {
        run: { font: 'Arial', size: 22, bold: true, color: '111827' },
        paragraph: { spacing: { before: 160, after: 60 }, keepNext: true },
      },
      heading6: {
        run: { font: 'Arial', size: 22, bold: true, color: '111827' },
        paragraph: { spacing: { before: 160, after: 60 }, keepNext: true },
      },
    },
  };
}

/** 从当前 BlockNote 文档生成 DOCX，媒体与 Mermaid 在浏览器内完成嵌入。 */
export async function exportNoteDocx(
  editor: CustomBlockNoteEditor,
  registry: NotePluginRegistry,
  options: NoteDocxExportOptions = {}
): Promise<Blob> {
  const title = options.title?.trim() || i18n.t('export.printDocumentTitle', { ns: 'note' });
  const blocks = projectNoteBlocksForExport(
    editor.document,
    registry,
    AI_DIFF_DISPLAY_MODE.OLD_ONLY,
    readAiContentFromEditorState(editor.prosemirrorState)
  );
  const body = await renderNoteDocxBlocks(blocks, { imageCache: new Map() });
  const document = new Document({
    creator: 'WisePen',
    title,
    numbering: { config: NOTE_DOCX_NUMBERING },
    styles: createDocumentStyles(),
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: title })],
          }),
          ...body,
        ],
      },
    ],
  });
  return Packer.toBlob(document);
}
