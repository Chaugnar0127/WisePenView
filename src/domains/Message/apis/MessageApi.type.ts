import type { PageApiRequest, PageR } from '@/apis/api.type';

export type ListUserMessagesApiRequest = PageApiRequest;

export interface UserMessageApiModel {
  messageId?: string | number | null;
  deliveryScope?: string | null;
  messageType?: string | null;
  title?: string | null;
  content?: string | null;
  jumpUrl?: string | null;
  extra?: string | null;
  read?: boolean | number | string | null;
  hasRead?: boolean | number | string | null;
  isRead?: boolean | number | string | null;
  readStatus?: boolean | number | string | null;
  readTime?: string | null;
  createTime?: string | null;
}

export type ListUserMessagesApiResponse = PageR<UserMessageApiModel>;

export interface ReadMessageApiRequest {
  messageId: string;
}
