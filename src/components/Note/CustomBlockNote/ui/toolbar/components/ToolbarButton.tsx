import { TOOLTIP_FOCUS_PASSTHROUGH_PROPS } from '@/layouts/_common/a11y/tooltipFocusPassthrough';
import { Button, ToggleButton, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { cloneElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import styles from '../style.module.less';
import { stopToolbarMouseDown } from '../utils';

export type ButtonGroupChildProps = Pick<ComponentProps<typeof Button>, '__button_group_child'>;

interface ToolbarButtonProps extends ButtonGroupChildProps {
  label: string;
  icon: ReactNode;
  isDisabled?: boolean;
  isActive?: boolean;
  className?: string;
  onPress?: () => void;
  overlayTrigger?: ReactElement;
}

export function ToolbarButton({
  label,
  icon,
  isDisabled,
  isActive,
  className,
  onPress,
  overlayTrigger,
  __button_group_child: isButtonGroupChild,
}: ToolbarButtonProps) {
  const button = (
    <Button
      __button_group_child={isButtonGroupChild}
      aria-label={label}
      aria-pressed={isActive}
      className={clsx(styles.toolbarButton, className)}
      isDisabled={isDisabled}
      isIconOnly
      size="sm"
      variant="ghost"
      onMouseDown={stopToolbarMouseDown}
      onPress={onPress}
    >
      {icon}
    </Button>
  );

  return (
    <Tooltip>
      <Tooltip.Trigger {...TOOLTIP_FOCUS_PASSTHROUGH_PROPS}>
        {overlayTrigger ? cloneElement(overlayTrigger, undefined, button) : button}
      </Tooltip.Trigger>
      <Tooltip.Content placement="bottom">{label}</Tooltip.Content>
    </Tooltip>
  );
}

interface ToolbarToggleButtonProps {
  id: string;
  label: string;
  icon: ReactNode;
  isDisabled?: boolean;
  onPress?: () => void;
}

export function ToolbarToggleButton({
  id,
  label,
  icon,
  isDisabled,
  onPress,
}: ToolbarToggleButtonProps) {
  return (
    <Tooltip>
      <Tooltip.Trigger {...TOOLTIP_FOCUS_PASSTHROUGH_PROPS}>
        <ToggleButton
          aria-label={label}
          id={id}
          isDisabled={isDisabled}
          isIconOnly
          size="sm"
          variant="ghost"
          onMouseDown={stopToolbarMouseDown}
          onPress={onPress}
        >
          {icon}
        </ToggleButton>
      </Tooltip.Trigger>
      <Tooltip.Content placement="bottom">{label}</Tooltip.Content>
    </Tooltip>
  );
}
