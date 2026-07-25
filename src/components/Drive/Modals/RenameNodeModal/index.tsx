import { FormField, Input } from '@/components/Input';
import AppFormDialog from '@/components/Overlay/AppFormDialog';
import { useDriveService } from '@/domains';
import { useEffectForce } from '@/hooks/useEffectForce';
import { parseErrorMessage } from '@/utils/error';
import { validateReservedName } from '@/utils/tag/validateReservedName';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DriveActionTarget } from '../../common/driveComponentModel';
import type { RenameNodeModalProps } from './index.type';
import styles from './style.module.less';

function getDefaultName(node: DriveActionTarget | null): string {
  if (!node) return '';
  if (node.type === 'folder') return node.name;
  return node.title;
}

function RenameNodeModal({ isOpen, node, groupId, onOpenChange, onSuccess }: RenameNodeModalProps) {
  const { t } = useTranslation('drive');
  const driveService = useDriveService();
  const [name, setName] = useState(getDefaultName(node));
  const [nameError, setNameError] = useState('');

  /**
   * 执行时机：弹窗打开并绑定目标节点时，同步输入框默认名称。
   * 不可替代原因：弹窗组件常驻挂载，useState 初始值不会随右栏选中节点变化而重置。
   * cleanup：没有订阅或异步资源需要释放。
   */
  useEffectForce(() => {
    if (!isOpen) return;
    setName(getDefaultName(node));
    setNameError('');
  }, [isOpen, node?.id]);

  const { loading, run: runRenameNode } = useRequest(
    async (trimmed: string) => {
      if (!node) return;
      await driveService.renameNode({ nodeId: node.id, newName: trimmed, groupId });
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('rename.success'));
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const handleSubmit = () => {
    if (!node) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('rename.required'));
      return;
    }
    if (node.type === 'folder') {
      const validation = validateReservedName(trimmed);
      if (!validation.valid) {
        setNameError(t('create.validation.reservedPrefix'));
        return;
      }
    }
    runRenameNode(trimmed);
  };

  const title = node?.type === 'folder' ? t('rename.folderTitle') : t('rename.fileTitle');

  return (
    <AppFormDialog
      isOpen={isOpen && !!node}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setNameError('');
        }
        onOpenChange(nextOpen);
      }}
      title={title}
      onSubmit={handleSubmit}
      isSubmitting={loading}
      isDismissable={!loading}
    >
      <FormField
        aria-label={t('rename.nodeNameAria')}
        label={t('rename.nameLabel')}
        className={styles.input}
        value={name}
        autoFocus
        onChange={(value) => {
          setName(value);
          setNameError('');
        }}
        errorMessage={nameError}
        isRequired
      >
        <Input placeholder={t('rename.placeholder')} />
      </FormField>
    </AppFormDialog>
  );
}

export default RenameNodeModal;
