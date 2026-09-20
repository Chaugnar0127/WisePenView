import type { ResourcePermissionResourceType } from '@/domains/Resource';

export interface ResourcePermissionModalProps {
  isOpen: boolean;
  resourceId: string;
  resourceType: ResourcePermissionResourceType;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
