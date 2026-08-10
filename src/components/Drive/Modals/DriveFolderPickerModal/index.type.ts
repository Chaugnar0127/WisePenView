import type { DriveContainerNode, DriveNode } from '@/domains/Drive';

export interface DriveFolderPickerModalProps {
  isOpen: boolean;
  title: string;
  hint?: string;
  rootId?: string;
  groupId?: string;
  disabledNodeIds?: string[];
  isNodeSelectable?: (node: DriveNode) => boolean;
  isSubmitting?: boolean;
  confirmText?: string;
  cancelText?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (target: DriveContainerNode) => void;
}
