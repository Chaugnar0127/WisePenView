import type { AppIconButtonProps } from '../AppIconButton/index.type';

export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  isDisabled?: AppIconButtonProps['isDisabled'];
}
