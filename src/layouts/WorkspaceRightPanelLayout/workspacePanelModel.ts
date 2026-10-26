import {
  CHAT_PANEL_MAX_WIDTH,
  CHAT_PANEL_MIN_WIDTH,
  clampChatPanelWidth,
  clampWorkspaceContextPanelWidth,
  WORKSPACE_CONTEXT_PANEL_MAX_WIDTH,
  WORKSPACE_CONTEXT_PANEL_MIN_WIDTH,
} from '@/constants/layoutScale';

export const WORKSPACE_PANEL_IDS = ['chat', 'inlineComment', 'interact'] as const;

export type WorkspacePanelId = (typeof WORKSPACE_PANEL_IDS)[number];

export const getWorkspacePanelTargetId = (panelId: WorkspacePanelId): string =>
  `workspace-right-panel-${panelId}`;

export const getWorkspacePanelLabelId = (panelId: WorkspacePanelId): string =>
  `workspace-right-panel-label-${panelId}`;

export interface WorkspacePanelWidthBounds {
  minWidth: number;
  maxWidth: number;
}

export interface WorkspaceRightPanelSpec extends WorkspacePanelWidthBounds {
  id: WorkspacePanelId;
  label: string;
}

export const WORKSPACE_PANEL_WIDTH_BOUNDS: Record<WorkspacePanelId, WorkspacePanelWidthBounds> = {
  chat: {
    minWidth: CHAT_PANEL_MIN_WIDTH,
    maxWidth: CHAT_PANEL_MAX_WIDTH,
  },
  inlineComment: {
    minWidth: WORKSPACE_CONTEXT_PANEL_MIN_WIDTH,
    maxWidth: WORKSPACE_CONTEXT_PANEL_MAX_WIDTH,
  },
  interact: {
    minWidth: WORKSPACE_CONTEXT_PANEL_MIN_WIDTH,
    maxWidth: WORKSPACE_CONTEXT_PANEL_MAX_WIDTH,
  },
};

export function createWorkspacePanelSpecs(
  labels: Record<WorkspacePanelId, string>
): WorkspaceRightPanelSpec[] {
  return WORKSPACE_PANEL_IDS.map((panelId) => ({
    id: panelId,
    label: labels[panelId],
    ...WORKSPACE_PANEL_WIDTH_BOUNDS[panelId],
  }));
}

export function clampWorkspacePanelWidth(panelId: WorkspacePanelId, width: number): number {
  return panelId === 'chat' ? clampChatPanelWidth(width) : clampWorkspaceContextPanelWidth(width);
}
