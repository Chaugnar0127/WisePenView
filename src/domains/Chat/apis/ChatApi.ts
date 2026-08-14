import { apiGet, apiPost } from '@/apis/request';
import type {
  ActiveChatTurnApiRequest,
  ActiveChatTurnApiResponse,
  CreateSessionApiRequest,
  CreateSessionApiResponse,
  DeleteSessionApiRequest,
  DeleteSessionApiResponse,
  InitTemporaryAttachmentUploadApiRequest,
  InitTemporaryAttachmentUploadApiResponse,
  ListHistoryMessagesApiRequest,
  ListHistoryMessagesApiResponse,
  ListModelsApiResponse,
  ListSessionsApiRequest,
  ListSessionsApiResponse,
  ListToolsApiResponse,
  RenameSessionApiRequest,
  RenameSessionApiResponse,
  SetSessionAgentApiRequest,
  SetSessionAgentApiResponse,
} from './ChatApi.type';

/** Chat API: /chat/* */

function listModels(): Promise<ListModelsApiResponse> {
  return apiGet('/chat/model/listAvailableModels');
}

function listTools(): Promise<ListToolsApiResponse> {
  return apiGet('/chat/tool/listUserTools');
}

function initTemporaryAttachmentUpload(
  req: InitTemporaryAttachmentUploadApiRequest
): Promise<InitTemporaryAttachmentUploadApiResponse> {
  return apiPost('/chat/attachment/initUploadTemporaryAttachment', req);
}

export const ChatApi = {
  listModels,
  listTools,
  initTemporaryAttachmentUpload,
};

/** Chat Completion API: /chat/completions/* */

function getActiveTurn(req: ActiveChatTurnApiRequest): Promise<ActiveChatTurnApiResponse> {
  return apiGet('/chat/completions/active', { params: req });
}

export const ChatCompletionApi = {
  getActiveTurn,
};

/** Chat Session API: /chat/session/* */

function createSession(req: CreateSessionApiRequest): Promise<CreateSessionApiResponse> {
  return apiPost('/chat/session/createSession', req);
}

function setSessionAgent(req: SetSessionAgentApiRequest): Promise<SetSessionAgentApiResponse> {
  return apiPost(
    '/chat/session/setSessionAgent',
    {
      agent_id: req.agent_id,
      agent_version: req.agent_version,
    },
    {
      params: { session_id: req.session_id },
    }
  );
}

function renameSession(req: RenameSessionApiRequest): Promise<RenameSessionApiResponse> {
  return apiPost(
    '/chat/session/renameSession',
    { new_title: req.new_title },
    {
      params: { session_id: req.session_id },
    }
  );
}

function deleteSession(req: DeleteSessionApiRequest): Promise<DeleteSessionApiResponse> {
  return apiPost('/chat/session/deleteSession', undefined, {
    params: { session_id: req.session_id },
  });
}

function listSessions(req: ListSessionsApiRequest): Promise<ListSessionsApiResponse> {
  return apiGet('/chat/session/listSessions', { params: req });
}

function listHistoryMessages(
  req: ListHistoryMessagesApiRequest
): Promise<ListHistoryMessagesApiResponse> {
  return apiGet('/chat/session/listHistoryMessages', {
    params: req,
  });
}

export const ChatSessionApi = {
  createSession,
  setSessionAgent,
  renameSession,
  deleteSession,
  listSessions,
  listHistoryMessages,
};
