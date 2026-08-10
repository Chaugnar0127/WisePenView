import type { DriveActionTarget } from '../../common/driveComponentModel';

export interface TrashDeleteModalProps {
  isOpen: boolean;
  nodes: DriveActionTarget[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
