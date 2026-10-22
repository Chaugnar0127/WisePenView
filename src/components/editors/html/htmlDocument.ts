export const HTML_PAGE_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

const HTML_METADATA = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${HTML_PAGE_CSP}">`;
const HEAD_OPEN_PATTERN = /<head(?:\s[^>]*)?>/i;
const HTML_OPEN_PATTERN = /<html(?:\s[^>]*)?>/i;

/** 为 Blob 文档补齐 charset 与后端同等级的网络限制 CSP。 */
export const buildHtmlDocument = (source: string): string => {
  const headMatch = source.match(HEAD_OPEN_PATTERN);
  if (headMatch?.index != null) {
    const insertAt = headMatch.index + headMatch[0].length;
    return `${source.slice(0, insertAt)}${HTML_METADATA}${source.slice(insertAt)}`;
  }

  const htmlMatch = source.match(HTML_OPEN_PATTERN);
  if (htmlMatch?.index != null) {
    const insertAt = htmlMatch.index + htmlMatch[0].length;
    return `${source.slice(0, insertAt)}<head>${HTML_METADATA}</head>${source.slice(insertAt)}`;
  }

  return `<!doctype html><html><head>${HTML_METADATA}</head><body>${source}</body></html>`;
};
