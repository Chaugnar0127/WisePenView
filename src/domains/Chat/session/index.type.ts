export interface ChatFrontendState<Key extends string = string, Value = unknown> {
  key: Key;
  value: Value;
  disabled?: boolean;
}

interface ChatSelectedResourceContext {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  enabled: boolean;
}

interface ChatUploadedAttachmentContext {
  attachmentId: string;
  filename: string;
  enabled: boolean;
}

export interface ChatCompletionRequest {
  session_id: string;
  query: string;
  model?: string;
  provider_id?: string;
  runtime_options?: Record<string, unknown>;
  frontend_states?: ChatFrontendState[];
  user_defined_attachment_ids?: string[];
  tool_selection_default_enabled?: boolean;
  tool_selection_overrides?: Record<string, boolean>;
  user_defined_on_demand_skill_ids?: string[];
  client_tool_capabilities?: ClientToolCapabilityRequest[];
}

export interface ClientToolCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ClientToolCapabilityRequest {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface SendSessionMessageOptions {
  sessionId?: string;
  model?: string;
  providerId?: string;
  runtimeOptions?: Record<string, unknown>;
  frontendStates?: ChatFrontendState[];
  selectedResources?: ChatSelectedResourceContext[];
  uploadedAttachments?: ChatUploadedAttachmentContext[];
  toolSelectionDefaultEnabled?: boolean;
  toolSelectionOverrides?: Record<string, boolean>;
  onDemandSkillIds?: string[];
  clientToolCapabilities?: ClientToolCapability[];
}

export interface UseChatSessionOptions {
  sessionId: string;
  model?: string;
}
