const X_DEVELOPER_HEADER = 'X-Developer';

export function getXDeveloper(): string {
  if (!import.meta.env.DEV) return '';
  return import.meta.env.VITE_X_DEVELOPER?.trim() ?? '';
}

export function applyXDeveloperHeader(headers: Headers): Headers {
  const developer = getXDeveloper();
  if (developer) {
    headers.set(X_DEVELOPER_HEADER, developer);
  }
  return headers;
}
