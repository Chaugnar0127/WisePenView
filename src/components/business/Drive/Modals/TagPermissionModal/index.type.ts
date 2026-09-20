export interface TagPermissionModalProps {
  isOpen: boolean;
  groupId?: string;
  initialTagId?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export type TagMountPermissionModalProps = TagPermissionModalProps;
