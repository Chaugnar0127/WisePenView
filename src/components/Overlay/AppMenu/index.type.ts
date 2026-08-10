import type { Dropdown } from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

export type AppMenuBodyPadding = 'default' | 'none';

export interface AppMenuPopoverProps extends ComponentProps<typeof Dropdown.Popover> {
  bodyPadding?: AppMenuBodyPadding;
}

export interface AppMenuHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
}

export type AppMenuDividerProps = ComponentProps<'div'>;

export interface AppMenuSectionProps extends Omit<
  ComponentProps<typeof Dropdown.Section>,
  'children' | 'title'
> {
  children?: ReactNode;
  showDivider?: boolean;
  title?: ReactNode;
}

export interface AppMenuItemProps extends Omit<ComponentProps<typeof Dropdown.Item>, 'children'> {
  description?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  label?: ReactNode;
  selected?: boolean;
  shortcut?: ReactNode;
  children?: ReactNode;
}

export type AppMenuRootProps = ComponentProps<typeof Dropdown>;
export type AppMenuMenuProps = ComponentProps<typeof Dropdown.Menu>;
export type AppMenuTriggerProps = ComponentProps<typeof Dropdown.Trigger>;
