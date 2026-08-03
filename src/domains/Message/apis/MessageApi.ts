import { apiGet, apiPost } from '@/apis/request';
import type {
  ListUserMessagesApiRequest,
  ListUserMessagesApiResponse,
  ReadMessageApiRequest,
} from './MessageApi.type';

function listUserMessages(req: ListUserMessagesApiRequest): Promise<ListUserMessagesApiResponse> {
  return apiGet('/user/message/listMessages', { params: req });
}

function readMessage(req: ReadMessageApiRequest): Promise<void> {
  return apiPost('/user/message/readMessage', null, { params: req });
}

export const MessageApi = {
  listUserMessages,
  readMessage,
};
