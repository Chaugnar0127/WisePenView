import { Dropdown, Header, Label } from '@heroui/react';
import { Cloud, Plus } from 'lucide-react';
// TODO: 本地上传入口暂时下线；恢复时需恢复 Upload 导入与下方菜单项，并回归本地文件选择、上传及发送链路。
// import { Upload } from 'lucide-react';
import type { Key } from 'react';
import { useTranslation } from 'react-i18next';

import AppIconButton from '@/components/base/Button/AppIconButton';
import { GuideAnchor } from '@/components/base/Guide';
import { GUIDE_TOOL_ID } from '@/constants/tour';

import { useChatInputFiles, useChatInputStore, useChatInputStoreApi } from '../_context';

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
    <Dropdown isOpen={open} onOpenChange={setAttachmentOpen}>
      <Dropdown.Trigger
        render={({ disabled, ...triggerProps }) => (
          <GuideAnchor id={GUIDE_TOOL_ID.chatUpload}>
            <AppIconButton
              {...triggerProps}
              isDisabled={disabled}
              icon={<Plus size={18} aria-hidden="true" />}
              label={t('input.uploadMenu.trigger')}
            />
          </GuideAnchor>
        )}
      />
      <GuideAnchor id={GUIDE_TOOL_ID.chatUploadOpen} asChild>
        <Dropdown.Popover placement="top">
          <Dropdown.Menu aria-label={t('input.uploadMenu.aria')} onAction={handleAction}>
            <Dropdown.Section>
              <Header>{t('input.uploadMenu.title')}</Header>
              {/* TODO: 本地上传入口暂时下线；恢复时需回归本地文件选择、上传及发送链路。 */}
              {/*
              <Dropdown.Item id="local-file" textValue={t('input.uploadMenu.local')}>
                <Upload size={16} />
                <Label>{t('input.uploadMenu.local')}</Label>
              </Dropdown.Item>
              */}
              <Dropdown.Item id="cloud-file" textValue={t('input.uploadMenu.cloud')}>
                <Cloud size={16} />
                <Label>{t('input.uploadMenu.cloud')}</Label>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </GuideAnchor>
    </Dropdown>
  );
}

export default UploadMenu;
