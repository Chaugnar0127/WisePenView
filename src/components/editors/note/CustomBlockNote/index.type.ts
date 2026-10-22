import type {
  NoteInlineCommentDraft,
  NoteInlineCommentSession,
  NoteSelectionSnapshot,
} from '@/domains/Note';

import type { NoteOutlineItem } from './engines/outline';

export type { NoteOutlineItem } from './engines/outline';

export type NoteEditorAnchor =
  { kind: 'block'; blockId: string } | { kind: 'inlineComment'; threadId: string };

export interface NoteFindResult {
  current: number;
  total: number;
}

export interface NoteReplaceResult {
  replaced: number;
  result: NoteFindResult | null;
}

export interface NoteBodyEditorHandle {
  focus: () => void;
  openFind: (initialQuery?: string) => void;
  /** 返回是否在文档中命中目标块；未命中时不滚动，由调用方决定重试或提示 */
  scrollToAnchor: (anchor: NoteEditorAnchor) => boolean;
  /** 导出 PDF（桌面端直接保存到本地，浏览器端通过系统打印对话框另存） */
  exportPdf: (options?: { title?: string; defaultFileName?: string }) => Promise<void>;
  /** 导出 Word 文档（AIDiff 按仅旧文本投影） */
  exportDocx: (options?: { title?: string }) => Promise<NoteDocxArtifact>;
  /** 导出正文 Markdown artifact（AIDiff 按仅旧文本投影） */
  exportMarkdown: () => NoteMarkdownArtifact;
}

interface NoteDocxArtifact {
  blob: Blob;
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  extension: 'docx';
}

interface NoteMarkdownArtifact {
  content: string;
  mimeType: 'text/markdown;charset=utf-8';
  extension: 'md';
}

export interface NoteInlineCommentsBinding {
  session: NoteInlineCommentSession;
  onCreateRequest: (draft: NoteInlineCommentDraft) => void;
  onThreadSelect?: (threadId: string) => void;
}

export interface CustomBlockNoteProps {
  onOutlineChange?: (items: NoteOutlineItem[]) => void;
  onActiveHeadingChange?: (activeId: string | undefined) => void;
  onAiDiffPresenceChange?: (hasAiDiffContent: boolean) => void;
  onImageUploadCountChange?: (count: number) => void;
  onAskAi: (context: NoteSelectionSnapshot) => void;
  onAiDiffBodyContentHashChange?: (hash: string | undefined) => void;
  inlineComments?: NoteInlineCommentsBinding;
}
