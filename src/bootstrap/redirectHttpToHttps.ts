const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const shouldRedirectHttpToHttps = (location: Location): boolean => {
  if (location.protocol !== 'http:') return false;
  if (LOCAL_HOSTNAMES.has(location.hostname)) return false;
  if (typeof window.desktop !== 'undefined') return false;
  return true;
};

export const redirectHttpToHttps = (): void => {
  if (!import.meta.env.PROD) return;
  if (!shouldRedirectHttpToHttps(window.location)) return;

  const targetUrl = new URL(window.location.href);
  targetUrl.protocol = 'https:';
  window.location.replace(targetUrl.toString());
};
