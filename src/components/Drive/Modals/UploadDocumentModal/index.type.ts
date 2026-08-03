import type { ReactNode } from 'react';

export interface UploadDocumentModalProps {
  isOpen: boolean;
  pathTagId: string;
  description?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
