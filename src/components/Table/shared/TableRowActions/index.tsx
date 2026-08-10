import AppIconButton from '@/components/Button/AppIconButton';
import { AppMenu } from '@/components/Overlay';
import { EllipsisVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TableRowActionsProps } from './index.type';
import styles from './style.module.less';

function TableRowActions({ actions, ariaLabel, onAction }: TableRowActionsProps) {
  const { t } = useTranslation('table');
  const resolvedAriaLabel = ariaLabel ?? t('aria.moreActions');

  if (actions.length === 0) {
    return null;
  }

  return (
    <AppMenu>
      <AppIconButton
        icon={<EllipsisVertical size={16} aria-hidden="true" />}
        label={resolvedAriaLabel}
        size="sm"
        className={styles.trigger}
        overlayTrigger={<AppMenu.Trigger />}
      />
      <AppMenu.Popover placement="bottom end">
        <AppMenu.Menu
          aria-label={resolvedAriaLabel}
          onAction={(key) => {
            onAction(String(key));
          }}
        >
          {actions.map((action) =>
            action.variant === 'danger' ? (
              <AppMenu.DangerItem
                key={action.key}
                id={action.key}
                textValue={typeof action.label === 'string' ? action.label : action.key}
                isDisabled={action.disabled}
              >
                {action.label}
              </AppMenu.DangerItem>
            ) : (
              <AppMenu.Item
                key={action.key}
                id={action.key}
                textValue={typeof action.label === 'string' ? action.label : action.key}
                isDisabled={action.disabled}
              >
                {action.label}
              </AppMenu.Item>
            )
          )}
        </AppMenu.Menu>
      </AppMenu.Popover>
    </AppMenu>
  );
}

export default TableRowActions;
