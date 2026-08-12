import { getApiBaseUrl } from '@/apis/apiServerAddr';

export const DRAWIO_EMBED_URL =
  import.meta.env.VITE_DRAWIO_EMBED_URL || 'https://embed.diagrams.net/';

export const ONLYOFFICE_DOCUMENT_SERVER_PUBLIC_URL = import.meta.env
  .VITE_ONLYOFFICE_DOCUMENT_SERVER_PUBLIC_URL;

export function buildApiUrl(path: `/${string}`): string {
  return new URL(path, getApiBaseUrl()).toString();
}
