import { cn } from '@/utils/cn';
import { Dropdown, Header } from '@heroui/react';

import type {
  AppMenuDividerProps,
  AppMenuHeaderProps,
  AppMenuItemProps,
  AppMenuMenuProps,
  AppMenuPopoverProps,
  AppMenuRootProps,
  AppMenuSectionProps,
} from './index.type';
import styles from './style.module.less';

function AppMenuHeader({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: AppMenuHeaderProps) {
  return (
    <div className={cn(styles.header, className)} {...props}>
      {icon ? (
        <span className={styles.headerIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.headerText}>
        <span className={styles.headerTitle}>{title}</span>
        {description ? <span className={styles.headerDescription}>{description}</span> : null}
      </span>
      {action ? <span className={styles.headerAction}>{action}</span> : null}
    </div>
  );
}

function AppMenuDivider({ className, role = 'separator', ...props }: AppMenuDividerProps) {
  return <div className={cn(styles.divider, className)} role={role} {...props} />;
}

function AppMenuPopover({
  bodyPadding = 'default',
  children,
  className,
  ...props
}: AppMenuPopoverProps) {
  return (
    <Dropdown.Popover className={cn(styles.popover, className)} {...props}>
      <div className={bodyPadding === 'default' ? styles.popoverBodyDefault : undefined}>
        {children}
      </div>
    </Dropdown.Popover>
  );
}

function AppMenuMenu({ className, ...props }: AppMenuMenuProps) {
  return <Dropdown.Menu className={cn(styles.menu, className)} {...props} />;
}

function AppMenuSection({
  children,
  className,
  showDivider = false,
  title,
  ...props
}: AppMenuSectionProps) {
  return (
    <Dropdown.Section
      className={cn(styles.section, showDivider && styles.sectionWithDivider, className)}
      {...props}
    >
      {title ? <Header className={styles.sectionTitle}>{title}</Header> : null}
      {children}
    </Dropdown.Section>
  );
}

function AppMenuItem({
  children,
  className,
  description,
  disabled,
  icon,
  isDisabled,
  label,
  selected,
  shortcut,
  variant,
  ...props
}: AppMenuItemProps) {
  const content =
    label || description || icon || shortcut ? (
      <>
        {icon ? (
          <span className={styles.itemIcon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={styles.itemText}>
          <span className={styles.itemLabel}>{label ?? children}</span>
          {description ? <span className={styles.itemDescription}>{description}</span> : null}
        </span>
        {shortcut ? (
          <span className={styles.itemTrailing}>
            <span className={styles.shortcut}>{shortcut}</span>
          </span>
        ) : null}
      </>
    ) : (
      children
    );

  return (
    <Dropdown.Item
      className={cn(styles.item, variant === 'danger' && styles.dangerItem, className)}
      data-selected={selected || undefined}
      isDisabled={isDisabled ?? disabled}
      variant={variant}
      {...props}
    >
      {content}
    </Dropdown.Item>
  );
}

function AppMenuDangerItem(props: AppMenuItemProps) {
  return (
    <AppMenuItem {...props} className={cn(styles.dangerItem, props.className)} variant="danger" />
  );
}

function AppMenuRoot(props: AppMenuRootProps) {
  return <Dropdown {...props} />;
}

export const AppMenu = Object.assign(AppMenuRoot, {
  DangerItem: AppMenuDangerItem,
  Divider: AppMenuDivider,
  Header: AppMenuHeader,
  Item: AppMenuItem,
  Menu: AppMenuMenu,
  Popover: AppMenuPopover,
  Root: AppMenuRoot,
  Section: AppMenuSection,
  SubmenuIndicator: Dropdown.SubmenuIndicator,
  SubmenuTrigger: Dropdown.SubmenuTrigger,
  Trigger: Dropdown.Trigger,
});

export default AppMenu;
