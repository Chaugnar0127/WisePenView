export type SidebarMotionPhase = 'expanded' | 'collapsing' | 'collapsed' | 'expanding';

export interface AppSidebarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggle: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
  motionPhase?: SidebarMotionPhase;
}
