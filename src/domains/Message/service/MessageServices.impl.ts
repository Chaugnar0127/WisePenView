import { MessageApi } from '../apis/MessageApi';
import { MessageServicesMap } from '../mapper/MessageServices.map';
import type {
  IMessageService,
  ListUserMessagesRequest,
  ListUserMessagesResponse,
  ReadMessageRequest,
} from './index.type';

const listUserMessages = async (
  params: ListUserMessagesRequest
): Promise<ListUserMessagesResponse> => {
  const query = MessageServicesMap.mapListUserMessagesRequest(params);
  const data = await MessageApi.listUserMessages(query);
  return MessageServicesMap.mapListUserMessagesFromApi(data);
};

const readMessage = async (params: ReadMessageRequest): Promise<void> => {
  const query = MessageServicesMap.mapReadMessageRequest(params);
  await MessageApi.readMessage(query);
};

export const createMessageServices = (): IMessageService => ({
  listUserMessages,
  readMessage,
});
