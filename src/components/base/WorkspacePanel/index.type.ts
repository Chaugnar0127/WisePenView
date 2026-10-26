import type { ReactNode } from 'react';

export interface WorkspacePanelHeaderProps {
  title: ReactNode;
  titleId?: string;
  closeLabel: string;
  onClose?: () => void;
  actions?: ReactNode;
  className?: string;
}

export interface WorkspacePanelProps extends Omit<WorkspacePanelHeaderProps, 'titleId'> {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}
