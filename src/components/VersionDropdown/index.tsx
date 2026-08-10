import { AppMenu } from '@/components/Overlay';
import { Button } from '@heroui/react';
import { ChevronDown, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VersionDropdownProps } from './index.type';

function VersionDropdown({ items, disabledKeys, formatVersion, onSelect }: VersionDropdownProps) {
  const { t } = useTranslation('common');
  const currentItem = items.find((item) => item.current) ?? items[0];

  return (
    <AppMenu>
      <AppMenu.Trigger>
        <Button aria-label={t('version.selectAria')} variant="secondary">
          <GitBranch size={16} />
          <span>{currentItem ? formatVersion(currentItem.version) : '-'}</span>
          <ChevronDown size={10} />
        </Button>
      </AppMenu.Trigger>
      <AppMenu.Popover>
        <AppMenu.Menu
          disabledKeys={disabledKeys}
          onAction={(key) => {
            const item = items.find((versionItem) => versionItem.key === key);
            if (item) onSelect?.(item.version);
          }}
        >
          {items.map((item) => (
            <AppMenu.Item key={item.key} id={item.key} textValue={formatVersion(item.version)}>
              {formatVersion(item.version)}
              {item.current ? t('version.current') : ''}
            </AppMenu.Item>
          ))}
        </AppMenu.Menu>
      </AppMenu.Popover>
    </AppMenu>
  );
}

export default VersionDropdown;
