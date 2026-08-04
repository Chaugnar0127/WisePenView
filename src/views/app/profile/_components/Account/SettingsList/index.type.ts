import type { ReactNode } from 'react';

export interface SettingsListItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** 空值时弱化展示（如「-」） */
  empty?: boolean;
}

export interface SettingsListProps {
  items: SettingsListItem[];
  className?: string;
}
