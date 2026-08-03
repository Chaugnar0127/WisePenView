export interface JoinByInviteCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  inviteCodeLabel: string;
  hint: string;
  invalidCodeMessage: string;
  successMessage: string;
  initialInviteCode?: string;
  onJoin: (inviteCode: string) => Promise<void>;
  onSuccess?: () => void;
}
