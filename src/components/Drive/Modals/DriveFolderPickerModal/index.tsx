import { AppButton } from '@/components/Button';
import AppModal from '@/components/Overlay/AppModal';
import type { DriveContainerNode } from '@/domains/Drive';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DriveNavigator from '../../DriveNavigator';
import type { DriveFolderPickerModalProps } from './index.type';
import styles from './style.module.less';

function DriveFolderPickerDialog({
  isOpen,
  title,
  hint,
  rootId,
  groupId,
  disabledNodeIds,
  isNodeSelectable,
  isSubmitting = false,
  confirmText,
  cancelText,
  onOpenChange,
  onConfirm,
}: DriveFolderPickerModalProps) {
  const { t } = useTranslation('common');
  const [selectedTarget, setSelectedTarget] = useState<DriveContainerNode>();

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) return;
    if (!open) setSelectedTarget(undefined);
    onOpenChange(open);
  };

  const handleConfirm = () => {
    if (!selectedTarget || isSubmitting) return;
    onConfirm(selectedTarget);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={title}
      size="md"
      isDismissable={!isSubmitting}
      actions={
        <>
          <AppButton
            variant="secondary"
            isDisabled={isSubmitting}
            onPress={() => handleOpenChange(false)}
          >
            {cancelText ?? t('actions.cancel')}
          </AppButton>
          <AppButton
            variant="primary"
            isDisabled={isSubmitting || !selectedTarget}
            aria-busy={isSubmitting || undefined}
            onPress={handleConfirm}
          >
            {confirmText ?? t('actions.confirm')}
          </AppButton>
        </>
      }
    >
      <div className={styles.wrapper}>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
        <div className={styles.treeWrap}>
          <DriveNavigator
            rootId={rootId}
            groupId={groupId}
            renderableTypes={['root', 'folder']}
            selectableTypes={['root', 'folder']}
            disabledNodeIds={disabledNodeIds}
            isNodeSelectable={isNodeSelectable}
            disabled={isSubmitting}
            onNodeChange={(selected) => {
              const node = selected[0];
              setSelectedTarget(
                node && (node.type === 'root' || node.type === 'folder') ? node : undefined
              );
            }}
          />
        </div>
      </div>
    </AppModal>
  );
}

function DriveFolderPickerModal(props: DriveFolderPickerModalProps) {
  return props.isOpen ? <DriveFolderPickerDialog {...props} /> : null;
}

export default DriveFolderPickerModal;
