export interface JoinGroupModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
  initialInviteCode?: string;
}
