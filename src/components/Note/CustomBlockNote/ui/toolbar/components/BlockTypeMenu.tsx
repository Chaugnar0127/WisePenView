import { blockNoteSchema } from '@/components/Note/CustomBlockNote/registry/noteEditorComposition';
import {
  applyBlockTypeToBlocks,
  blockMatchesBlockTypeItem,
  getAvailableBlockTypeItems,
  type BlockTypeMenuItem,
} from '@/components/Note/CustomBlockNote/ui/editorMenus/blockTypes';
import { AppMenu } from '@/components/Overlay';
import { cn } from '@/utils/cn';
import { useBlockNoteEditor, useEditorState } from '@blocknote/react';
import { Check, Heading } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../style.module.less';
import { getSelectedBlocks } from '../utils';
import { ToolbarButton, type ButtonGroupChildProps } from './ToolbarButton';

function BlockTypeDropdownItem({
  item,
  isSelected,
}: {
  item: BlockTypeMenuItem;
  isSelected: boolean;
}) {
  const Icon = item.icon;
  return (
    <AppMenu.Item
      id={item.key}
      textValue={item.label}
      className={styles.blockTypeMenuItem}
      selected={isSelected}
    >
      <span className={styles.blockTypeMenuIcon}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className={styles.blockTypeMenuLabel}>{item.label}</span>
      <span className={styles.blockTypeMenuCheck} aria-hidden="true">
        {isSelected ? <Check size={16} /> : null}
      </span>
    </AppMenu.Item>
  );
}

export function BlockTypeMenu(buttonGroupProps: ButtonGroupChildProps) {
  const { t } = useTranslation('note');
  const editor = useBlockNoteEditor(blockNoteSchema);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) {
        return undefined;
      }
      const selectedBlocks = getSelectedBlocks(editor);
      const firstBlock = selectedBlocks[0];
      const { primaryItems, headingItems, allItems } = getAvailableBlockTypeItems(editor);
      const selectedItem = [...primaryItems, ...headingItems].find((item) =>
        blockMatchesBlockTypeItem(firstBlock, item)
      );
      return { selectedBlocks, primaryItems, headingItems, allItems, selectedItem };
    },
  });

  if (!state || !state.selectedItem) {
    return null;
  }

  const selectedItem = state.selectedItem;
  const selectedInMoreHeading = state.headingItems.some((item) => item.key === selectedItem.key);
  const SelectedIcon = selectedItem.icon;
  const itemMap = new Map(state.allItems.map((item) => [item.key, item]));

  const applyBlockType = (key: string) => {
    const item = itemMap.get(key);
    if (!item) {
      return;
    }
    editor.focus();
    applyBlockTypeToBlocks(editor, state.selectedBlocks, item);
  };

  return (
    <AppMenu>
      <AppMenu.Trigger>
        <ToolbarButton
          {...buttonGroupProps}
          icon={<SelectedIcon size={20} aria-hidden="true" />}
          label={t('editor.blockType.label')}
        />
      </AppMenu.Trigger>
      <AppMenu.Popover className={styles.blockTypeMenuPopover} placement="bottom start">
        <AppMenu.Menu
          aria-label={t('editor.blockType.label')}
          className={styles.blockTypeMenu}
          selectionMode="single"
          selectedKeys={selectedInMoreHeading ? [] : [selectedItem.key]}
          onAction={(key) => applyBlockType(String(key))}
        >
          {state.primaryItems.slice(0, 4).map((item) => (
            <BlockTypeDropdownItem
              key={item.key}
              item={item}
              isSelected={selectedItem.key === item.key}
            />
          ))}

          {state.headingItems.length > 0 ? (
            <AppMenu.SubmenuTrigger>
              <AppMenu.Item
                id="more-headings"
                textValue={t('editor.blockType.moreHeadings')}
                selected={selectedInMoreHeading}
                className={cn(
                  styles.blockTypeMenuItem,
                  selectedInMoreHeading && styles.blockTypeMenuItemActive
                )}
              >
                <span className={styles.blockTypeMenuIcon}>
                  <Heading size={20} aria-hidden="true" />
                </span>
                <span className={styles.blockTypeMenuLabel}>
                  {t('editor.blockType.moreHeadings')}
                </span>
                <AppMenu.SubmenuIndicator className={styles.blockTypeMenuCheck} />
              </AppMenu.Item>
              <AppMenu.Popover className={styles.blockTypeMenuPopover} placement="right top">
                <AppMenu.Menu
                  aria-label={t('editor.blockType.moreHeadings')}
                  className={styles.blockTypeMenu}
                  selectionMode="single"
                  selectedKeys={selectedInMoreHeading ? [selectedItem.key] : []}
                  onAction={(key) => applyBlockType(String(key))}
                >
                  {state.headingItems.map((item) => (
                    <BlockTypeDropdownItem
                      key={item.key}
                      item={item}
                      isSelected={selectedItem.key === item.key}
                    />
                  ))}
                </AppMenu.Menu>
              </AppMenu.Popover>
            </AppMenu.SubmenuTrigger>
          ) : null}

          {state.primaryItems.slice(4).map((item) => (
            <BlockTypeDropdownItem
              key={item.key}
              item={item}
              isSelected={selectedItem.key === item.key}
            />
          ))}
        </AppMenu.Menu>
      </AppMenu.Popover>
    </AppMenu>
  );
}
