import type { JavaLongApiValue } from '@/apis/api.type';
import type { ResourceItemApiResponse } from '@/domains/Resource/apis/ResourceApi.type';

/** 与后端 SingleHtmlPageStatus 字面值一致。 */
export type SingleHtmlPageStatusApiValue =
  'UPLOADING' | 'UPLOADED' | 'REGISTERING_RES' | 'READY' | 'REGISTERING_RES_TIMEOUT' | 'FAILED';

export interface GetSingleHtmlPageInfoApiRequest {
  resourceId: string;
  targetVersion?: number;
}

export interface SingleHtmlPageVersionInfoApiResponse {
  singleHtmlPageId?: string;
  resourceId?: string;
  version?: number;
  singleHtmlPageStatus?: SingleHtmlPageStatusApiValue | null;
  size?: JavaLongApiValue | null;
  createTime?: string | null;
  updateTime?: string | null;
}

export interface SingleHtmlPageInfoApiResponse {
  resourceInfo: ResourceItemApiResponse;
  currentVersion?: number | null;
  versionInfo?: SingleHtmlPageVersionInfoApiResponse | null;
}

export interface GetSingleHtmlPageContentApiRequest {
  resourceId: string;
  targetVersion?: number;
}
