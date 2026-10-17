import type { LucideIcon } from 'lucide-react';

import type { GuideToolId } from '@/constants/tour';

export interface HeaderNavItem {
  key: string;
  name: string;
  icon: LucideIcon;
  onPress: () => void;
  isDisabled?: boolean;
  /** 新手指引的固定目标。不传则不参与高亮。 */
  toolId?: GuideToolId;
}

export interface HeaderNavSection {
  key: string;
  items: readonly HeaderNavItem[];
}

export interface HeaderNavProps {
  ariaLabel: string;
  activeKey?: string;
  collapsed?: boolean;
  items?: readonly HeaderNavItem[];
  sections?: readonly HeaderNavSection[];
  showIndicator?: boolean;
  labelsHidden?: boolean;
}
