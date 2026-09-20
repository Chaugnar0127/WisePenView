import type { AppAlertDialogType } from '../AppAlertDialog/index.type';

export interface UnsavedChangesDialogProps {
  type?: AppAlertDialogType;
  isOpen: boolean;
  isLoading?: boolean;
  title: string;
  description: string;
  cancelText?: string;
  discardText?: string;
  confirmText: string;
  onCancel: () => void;
  onDiscard?: () => void;
  onConfirm: () => void;
}
