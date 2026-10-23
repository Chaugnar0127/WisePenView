export const buildHtmlPageCsp = (assetOrigin: string): string =>
  [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    `style-src 'unsafe-inline' ${assetOrigin}`,
    'img-src data: blob:',
    "connect-src 'none'",
    "form-action 'none'",
    `base-uri ${assetOrigin}`,
  ].join('; ');

const escapeHtmlAttribute = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

const buildHtmlMetadata = (assetOrigin: string): string =>
  [
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${buildHtmlPageCsp(assetOrigin)}">`,
    `<base href="${escapeHtmlAttribute(`${assetOrigin}/`)}">`,
  ].join('');

const HEAD_OPEN_PATTERN = /<head(?:\s[^>]*)?>/i;
const HTML_OPEN_PATTERN = /<html(?:\s[^>]*)?>/i;

/**
 * 为 Blob 文档补齐 charset、资源根地址与网络限制 CSP。
 * Blob URL 不能作为根路径的 base URL，必须显式注入 API origin，页面里的
 * `/singleHtmlPage/assets/...` 才能解析到后端资源。
 */
export const buildHtmlDocument = (source: string, assetBaseUrl: string): string => {
  const assetOrigin = new URL('/', assetBaseUrl).origin;
  const metadata = buildHtmlMetadata(assetOrigin);
  const headMatch = source.match(HEAD_OPEN_PATTERN);
  if (headMatch?.index != null) {
    const insertAt = headMatch.index + headMatch[0].length;
    return `${source.slice(0, insertAt)}${metadata}${source.slice(insertAt)}`;
  }

  const htmlMatch = source.match(HTML_OPEN_PATTERN);
  if (htmlMatch?.index != null) {
    const insertAt = htmlMatch.index + htmlMatch[0].length;
    return `${source.slice(0, insertAt)}<head>${metadata}</head>${source.slice(insertAt)}`;
  }

  return `<!doctype html><html><head>${metadata}</head><body>${source}</body></html>`;
};
