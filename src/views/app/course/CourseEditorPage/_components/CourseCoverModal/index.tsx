import { UploadZone } from '@/components/Input';
import AppModal from '@/components/Overlay/AppModal';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';

interface CourseCoverModalProps {
  isOpen: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onFileChange: (file: File | null) => void;
  onConfirm: () => void;
}

function CourseCoverModal({
  isOpen,
  file,
  onOpenChange,
  onFileChange,
  onConfirm,
}: CourseCoverModalProps) {
  const { t } = useTranslation('course');

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('editor.actions.changeCover')}
      actions={
        <>
          <Button variant="secondary" onPress={() => onOpenChange(false)}>
            {t('editor.actions.cancel')}
          </Button>
          <Button variant="primary" isDisabled={!file} onPress={onConfirm}>
            {t('editor.actions.confirm')}
          </Button>
        </>
      }
    >
      <UploadZone
        file={file}
        accept="image/*"
        label={t('editor.fields.coverUpload')}
        onFileChange={onFileChange}
      />
    </AppModal>
  );
}

export default CourseCoverModal;
