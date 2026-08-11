import type { Group } from '@/domains/Group';
import type { ResourceSkillSummary } from '@/domains/Resource';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';
import { computeFileMd5 } from '@/utils/oss/computeFileMd5';
import { putOssPresignedUrl } from '@/utils/oss/ossPresignedPut';
import { parseExtension } from '@/utils/parser/extensionParser';
import { ChatApi, ChatSessionApi } from '../apis/ChatApi';
import type { ChatAgentOption } from '../entity/agent';
import type { WisePenUIMessage } from '../entity/message';
import { buildAgentFromResourceItem } from '../mapper/agent.mapper';
import { ChatServicesMap } from '../mapper/ChatServices.map';
import { getPrimarySkillsForAgent } from '../mapper/skillScope.mapper';
import { mapResourceItemToResourceSkillSummary } from '../mapper/workspace.mapper';
import type {
  ChatInputCapabilityOptions,
  ChatModel,
  ChatServiceDeps,
  ChatSession,
  CreateSessionRequest,
  DeleteSessionRequest,
  GetChatInputCapabilityOptionsParams,
  IChatService,
  ListChatInputAgentsRequest,
  ListChatInputGroupsRequest,
  ListChatInputSkillsRequest,
  ListHistoryMessagesRequest,
  ListSessionsRequest,
  PageResult,
  RenameSessionRequest,
  SetSessionAgentRequest,
  ToolOption,
  UploadAttachmentParams,
  UploadAttachmentResult,
} from './index.type';

const CHAT_RESOURCE_PAGE_SIZE = 100;

const getModels = async (): Promise<ChatModel[]> => {
  const data = await ChatApi.listModels();
  return ChatServicesMap.mapGetModelsFromApi(data);
};

const buildPageResult = <T>(
  list: T[],
  page: number,
  size: number,
  total: number
): PageResult<T> => ({
  list,
  total,
  page,
  size,
  totalPage: size > 0 ? Math.max(1, Math.ceil(total / size)) : 1,
});

const listChatInputGroups = async (
  deps: ChatServiceDeps,
  params: ListChatInputGroupsRequest
): Promise<PageResult<Group>> => {
  const query = {
    groupRoleFilter: 'ALL' as const,
    page: params.page,
    size: params.size,
  };
  const payload = await deps.groupService.fetchGroupList(query);
  return buildPageResult(payload.groups, params.page, params.size, payload.total);
};

const listChatInputAgents = async (
  deps: ChatServiceDeps,
  params: ListChatInputAgentsRequest
): Promise<PageResult<ChatAgentOption>> => {
  const query = {
    page: params.page,
    size: params.size,
    sortBy: 'NAME',
    sortDir: 'ASC',
    resourceType: 'AGENT',
  } as const;

  if (params.scope === 'GROUP') {
    if (!params.groupId) {
      return buildPageResult([], params.page, params.size, 0);
    }
    const payload = await deps.resourceService.getGroupResources({
      ...query,
      groupId: params.groupId,
    });
    const list = payload.list.map((item) =>
      buildAgentFromResourceItem(item, {
        groupId: params.groupId!,
        groupName: params.groupName ?? '',
      })
    );
    return buildPageResult(list, payload.page, payload.size, payload.total);
  }

  const payload = await deps.resourceService.getUserResources(query);
  return buildPageResult(
    payload.list.map((item) => buildAgentFromResourceItem(item)),
    payload.page,
    payload.size,
    payload.total
  );
};

const listChatInputSkills = async (
  deps: ChatServiceDeps,
  params: ListChatInputSkillsRequest
): Promise<PageResult<ResourceSkillSummary>> => {
  const query = {
    page: params.page,
    size: params.size,
    sortBy: 'NAME',
    sortDir: 'ASC',
    resourceType: 'SKILL',
  } as const;

  if (params.scope === 'GROUP') {
    if (!params.groupId) {
      return buildPageResult([], params.page, params.size, 0);
    }
    const payload = await deps.resourceService.getGroupResources({
      ...query,
      groupId: params.groupId,
    });
    const list = payload.list.map((item) =>
      mapResourceItemToResourceSkillSummary(item, {
        groupId: params.groupId!,
        groupName: params.groupName ?? '',
      })
    );
    return buildPageResult(list, payload.page, payload.size, payload.total);
  }

  const payload = await deps.resourceService.getUserResources(query);
  return buildPageResult(
    payload.list.map((item) => mapResourceItemToResourceSkillSummary(item)),
    payload.page,
    payload.size,
    payload.total
  );
};

const getChatInputCapabilityOptions = async (
  deps: ChatServiceDeps,
  params: GetChatInputCapabilityOptionsParams
): Promise<ChatInputCapabilityOptions> => {
  const [skillsPage, tools] = await Promise.all([
    listChatInputSkills(
      deps,
      params.agent?.agentType === 'GROUP' && params.agent.groupId
        ? {
            scope: 'GROUP',
            groupId: params.agent.groupId,
            groupName: params.agent.groupName,
            page: 1,
            size: CHAT_RESOURCE_PAGE_SIZE,
          }
        : {
            scope: 'PERSONAL',
            page: 1,
            size: CHAT_RESOURCE_PAGE_SIZE,
          }
    ),
    getTools(),
  ]);
  const primarySkills = getPrimarySkillsForAgent(skillsPage.list, params.agent);

  return {
    primarySkills,
    tools,
  };
};

const createSession = async (params?: CreateSessionRequest): Promise<ChatSession> => {
  const payload = ChatServicesMap.mapCreateSessionRequest(params);
  const data = await ChatSessionApi.createSession(payload);
  if (!data) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_CREATE_SESSION_FAILED);
  }
  return ChatServicesMap.mapCreateSessionFromApi(data);
};

const setSessionAgent = async (params: SetSessionAgentRequest): Promise<ChatSession> => {
  const payload = ChatServicesMap.mapSetSessionAgentRequest(params);
  const data = await ChatSessionApi.setSessionAgent(payload);
  if (!data) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_CREATE_SESSION_FAILED);
  }
  return ChatServicesMap.mapSetSessionAgentFromApi(data);
};

const renameSession = async (params: RenameSessionRequest): Promise<ChatSession> => {
  const payload = ChatServicesMap.mapRenameSessionRequest(params);
  const data = await ChatSessionApi.renameSession(payload);
  if (!data) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_RENAME_SESSION_FAILED);
  }
  return ChatServicesMap.mapRenameSessionFromApi(data);
};

const deleteSession = async (params: DeleteSessionRequest): Promise<void> => {
  await ChatSessionApi.deleteSession({ session_id: params.sessionId });
};

const listSessions = async (params?: ListSessionsRequest): Promise<PageResult<ChatSession>> => {
  const query = ChatServicesMap.mapListSessionsRequest(params);
  const payload = await ChatSessionApi.listSessions(query);
  return ChatServicesMap.mapListSessionsFromApi(payload);
};

const listHistoryMessages = async (
  params: ListHistoryMessagesRequest
): Promise<PageResult<WisePenUIMessage>> => {
  const query = ChatServicesMap.mapListHistoryMessagesRequest(params);
  const payload = await ChatSessionApi.listHistoryMessages(query);
  return ChatServicesMap.mapListHistoryMessagesFromApi(payload);
};

const getTools = async (): Promise<ToolOption[]> => {
  const response = await ChatApi.listTools();
  return response.tools.map((tool) => ({
    toolId: tool.name,
    label: tool.name,
    description: tool.description,
    enabled: tool.enabled,
    configured: tool.configured,
    requiresConfig: tool.requires_config,
  }));
};

const uploadAttachment = async ({
  sessionId,
  file,
  saveToLibrary,
}: UploadAttachmentParams): Promise<UploadAttachmentResult> => {
  const md5 = await computeFileMd5(file);
  const extension = parseExtension(file.name);
  const res = await ChatApi.initTemporaryAttachmentUpload({
    session_id: sessionId,
    filename: file.name,
    extension,
    file_size: file.size,
    md5,
    enable_library: Boolean(saveToLibrary),
  });
  if (!res?.attachment_id) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_ATTACHMENT_UPLOAD_INIT_FAILED);
  }
  if (res.flash_uploaded) {
    return {
      attachmentId: res.attachment_id,
      filename: file.name,
    };
  }
  if (!res.put_url) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_ATTACHMENT_UPLOAD_INIT_FAILED);
  }
  await putOssPresignedUrl({
    putUrl: res.put_url,
    body: file,
    callbackHeader: res.callback_header ?? '',
  });
  return {
    attachmentId: res.attachment_id,
    filename: file.name,
  };
};

export const createChatServices = (deps: ChatServiceDeps): IChatService => ({
  getModels,
  listChatInputGroups: (params) => listChatInputGroups(deps, params),
  listChatInputAgents: (params) => listChatInputAgents(deps, params),
  listChatInputSkills: (params) => listChatInputSkills(deps, params),
  getChatInputCapabilityOptions: (params) => getChatInputCapabilityOptions(deps, params),
  createSession,
  setSessionAgent,
  renameSession,
  deleteSession,
  listSessions,
  listHistoryMessages,
  getTools,
  uploadAttachment,
});
