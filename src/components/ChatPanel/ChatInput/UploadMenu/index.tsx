import AppIconButton from '@/components/Button/AppIconButton';
import { AppMenu } from '@/components/Overlay';
import { Cloud, Plus, Upload } from 'lucide-react';
import type { Key } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatInputStore, useChatInputStoreApi } from '../_store/ChatInputStore';
import styles from '../style.module.less';
import { useChatInputFiles } from '../useChatInputFiles';

function UploadMenu() {
  const { t } = useTranslation('chat');
  const { openLocalFilePicker } = useChatInputFiles();
  const store = useChatInputStoreApi();
  const open = useChatInputStore((state) => state.attachmentOpen);
  const { setAttachmentOpen, setDocumentPickerOpen } = store.getState();

  const handleAction = (key: Key) => {
    if (key === 'local-file') {
      openLocalFilePicker();
      return;
    }
    if (key === 'cloud-file') {
      setAttachmentOpen(false);
      setDocumentPickerOpen(true);
    }
  };

  return (
    <AppMenu isOpen={open} onOpenChange={setAttachmentOpen}>
      <AppIconButton
        icon={<Plus size={18} aria-hidden="true" />}
        label={t('input.uploadMenu.trigger')}
        overlayTrigger={<AppMenu.Trigger />}
      />
      <AppMenu.Popover placement="top" bodyPadding="none">
        <AppMenu.Header title={t('input.uploadMenu.title')} />
        <AppMenu.Menu
          aria-label={t('input.uploadMenu.aria')}
          className={styles.popoverPanel}
          onAction={handleAction}
        >
          <AppMenu.Item
            id="local-file"
            textValue={t('input.uploadMenu.local')}
            icon={<Upload size={16} />}
            label={t('input.uploadMenu.local')}
          />
          <AppMenu.Item
            id="cloud-file"
            textValue={t('input.uploadMenu.cloud')}
            icon={<Cloud size={16} />}
            label={t('input.uploadMenu.cloud')}
          />
        </AppMenu.Menu>
      </AppMenu.Popover>
    </AppMenu>
  );
}

export default UploadMenu;
