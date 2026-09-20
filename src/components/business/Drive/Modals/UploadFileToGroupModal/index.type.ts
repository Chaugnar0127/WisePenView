export interface UploadFileToGroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前小组 ID（第二步小组树与资源挂载） */
  groupId: string;
  /** 全部成功后回调（例如刷新小组盘） */
  onSuccess?: () => void;
}
