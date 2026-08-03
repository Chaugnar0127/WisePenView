import type { UserMessage } from '../entity/message';

export interface IMessageService {
  listUserMessages(params: ListUserMessagesRequest): Promise<ListUserMessagesResponse>;
  readMessage(params: ReadMessageRequest): Promise<void>;
}

export interface ListUserMessagesRequest {
  page: number;
  size: number;
}

export interface ListUserMessagesResponse {
  messages: UserMessage[];
  total: number;
  page: number;
  size: number;
  totalPage: number;
}

export interface ReadMessageRequest {
  messageId: string;
}
