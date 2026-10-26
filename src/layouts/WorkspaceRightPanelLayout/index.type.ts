import type { ReactNode } from 'react';

import type { WorkspacePanelId, WorkspaceRightPanelSpec } from './workspacePanelModel';

export interface WorkspaceRightPanelLayoutProps {
  main: ReactNode;
  panels: readonly WorkspaceRightPanelSpec[];
  activePanelId: WorkspacePanelId | null;
  panelWidths: Record<WorkspacePanelId, number>;
  mainMinWidth: number;
  panelGroupId?: string;
  className?: string;
  resizeLabel: string;
  onPanelResize: (panelId: WorkspacePanelId, width: number) => void;
}
