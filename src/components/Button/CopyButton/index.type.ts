import type { AppIconButtonProps } from '../AppIconButton/index.type';

export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  disabledVariant?: AppIconButtonProps['disabledVariant'];
  isDisabled?: AppIconButtonProps['isDisabled'];
}
