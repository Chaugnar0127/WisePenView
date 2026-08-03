const HTML_TAG_PATTERN = /<[^>]+>/g;
const BLOCK_MARKER_PATTERN = /^\s{0,3}(?:#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/gm;
const TABLE_SEPARATOR_PATTERN = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/gm;

export function extractMarkdownPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) =>
      block
        .replace(/^```[^\n]*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim()
    )
    .replace(/~~~[\s\S]*?~~~/g, (block) =>
      block
        .replace(/^~~~[^\n]*\n?/, '')
        .replace(/\n?~~~\s*$/, '')
        .trim()
    )
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    .replace(/^\s{0,3}\[[^\]]+\]:\s+\S+.*$/gm, '')
    .replace(TABLE_SEPARATOR_PATTERN, '')
    .replace(BLOCK_MARKER_PATTERN, '')
    .replace(/[*_~`]/g, '')
    .replace(HTML_TAG_PATTERN, '')
    .replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}
