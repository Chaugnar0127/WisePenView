import { normalizeId } from '@/utils/normalize/normalizeId';
import type {
  ListUserMessagesApiRequest,
  ListUserMessagesApiResponse,
  ReadMessageApiRequest,
  UserMessageApiModel,
} from '../apis/MessageApi.type';
import type { UserMessage } from '../entity/message';
import type {
  ListUserMessagesRequest,
  ListUserMessagesResponse,
  ReadMessageRequest,
} from '../service/index.type';
import { normalizeMessageType } from './messageType.mapper';

const normalizeReadFlag = (value: UserMessageApiModel['read']): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'read', 'readed', 'yes', '1'].includes(normalized)) return true;
    if (['false', 'unread', 'no', '0'].includes(normalized)) return false;
  }
  return undefined;
};

const mapUserMessageApiModelToEntity = (raw: UserMessageApiModel): UserMessage => {
  const explicitRead =
    normalizeReadFlag(raw.read) ??
    normalizeReadFlag(raw.hasRead) ??
    normalizeReadFlag(raw.isRead) ??
    normalizeReadFlag(raw.readStatus);

  return {
    messageId: normalizeId(raw.messageId),
    deliveryScope: raw.deliveryScope ?? undefined,
    messageType: normalizeMessageType(raw.messageType ?? undefined) ?? raw.messageType ?? undefined,
    title: raw.title?.trim() ?? '',
    content: raw.content ?? '',
    jumpUrl: raw.jumpUrl?.trim() || undefined,
    extra: raw.extra ?? undefined,
    read: explicitRead ?? Boolean(raw.readTime),
    createTime: raw.createTime ?? undefined,
  };
};

const mapListUserMessagesRequest = (
  params: ListUserMessagesRequest
): ListUserMessagesApiRequest => ({
  page: params.page,
  size: params.size,
});

const mapListUserMessagesFromApi = (
  data: ListUserMessagesApiResponse
): ListUserMessagesResponse => ({
  messages: data.list.map(mapUserMessageApiModelToEntity),
  total: data.total,
  page: data.page,
  size: data.size,
  totalPage: data.totalPage,
});

const mapReadMessageRequest = (params: ReadMessageRequest): ReadMessageApiRequest => ({
  messageId: params.messageId,
});

export const MessageServicesMap = {
  mapListUserMessagesRequest,
  mapListUserMessagesFromApi,
  mapReadMessageRequest,
};
