import type { DriveNode } from '@/domains/Drive';
import type { DriveSelectionItem } from '../../common/driveComponentModel';

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
  onConfirm: (target: DriveSelectionItem) => void;
}
