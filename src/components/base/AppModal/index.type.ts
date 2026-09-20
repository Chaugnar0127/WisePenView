import type { ComponentProps, ReactNode } from 'react';

import type { Modal } from '@/components/base/Modal';

export type AppModalSize = ComponentProps<typeof Modal.Container>['size'];

export type AppModalPlacement = ComponentProps<typeof Modal.Container>['placement'];

export interface AppModalClassNames {
  container?: string;
  dialog?: string;
  header?: string;
  heading?: string;
  description?: string;
  body?: string;
  footer?: string;
}

export interface AppModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  size?: AppModalSize;
  placement?: AppModalPlacement;
  isDismissable?: boolean;
  actions?: ReactNode;
  footer?: ReactNode | false | null;
  contentMode?: 'body' | 'dialog';
  contentDelay?: number;
  deferContent?: boolean;
  className?: string;
  containerClassName?: string;
  dialogClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  classNames?: AppModalClassNames;
}

export type AppModalBodyProps = ComponentProps<typeof Modal.Body>;

export type AppModalFooterProps = ComponentProps<typeof Modal.Footer>;
