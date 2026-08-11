import type { ComponentProps, FormEvent, ReactNode } from 'react';

import type { Modal } from '../Modal';

export type AppFormDialogSize = ComponentProps<typeof Modal.Container>['size'];

export type AppFormDialogPlacement = ComponentProps<typeof Modal.Container>['placement'];

export interface AppFormDialogClassNames {
  backdrop?: string;
  container?: string;
  dialog?: string;
  form?: string;
  header?: string;
  heading?: string;
  description?: string;
  body?: string;
  footer?: string;
}

export interface AppFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  isDismissable?: boolean;
  size?: AppFormDialogSize;
  placement?: AppFormDialogPlacement;
  contentDelay?: number;
  deferContent?: boolean;
  actions?: ReactNode;
  footer?: ReactNode | false | null;
  formId?: string;
  className?: string;
  backdropClassName?: string;
  containerClassName?: string;
  dialogClassName?: string;
  formClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  classNames?: AppFormDialogClassNames;
}
