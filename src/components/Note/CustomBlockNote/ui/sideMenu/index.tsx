import AppIconButton from '@/components/Button/AppIconButton';
import { useNoteEditorReadOnlyContext } from '@/components/Note/CustomBlockNote/engines/editor/readOnly';
import {
  exportNoteFullHtml,
  exportNoteMarkdown,
} from '@/components/Note/CustomBlockNote/engines/markdown/markdownExport';
import type { CustomBlockNoteEditor } from '@/components/Note/CustomBlockNote/registry/noteEditorComposition';
import {
  blockNoteSchema,
  createDefaultNoteBlock,
  notePluginRegistry,
} from '@/components/Note/CustomBlockNote/registry/noteEditorComposition';
import type { NoteContentPlugin } from '@/components/Note/CustomBlockNote/registry/types';
import {
  applyBlockTypeToBlocks,
  blockMatchesBlockTypeItem,
  getAvailableBlockTypeItems,
  type BlockTypeMenuItem,
} from '@/components/Note/CustomBlockNote/ui/editorMenus/blockTypes';
import { ColorPaletteContent } from '@/components/Note/CustomBlockNote/ui/editorMenus/colorPalette';
import type { ColorKey } from '@/components/Note/CustomBlockNote/ui/editorMenus/colorPaletteData';
import {
  isRecord,
  toBlockUpdate,
  type NoteBlock,
  type NotePartialBlock,
} from '@/components/Note/CustomBlockNote/ui/editorMenus/utils';
import {
  NOTE_EDITOR_HIDDEN_DEFAULT_SLASH_MENU_KEY_SET,
  getNoteSlashMenuItems,
} from '@/components/Note/CustomBlockNote/ui/slashMenu/buildSlashMenuItems';
import {
  resolveSlashMenuGroup,
  sortSuggestionItemsForDisplay,
} from '@/components/Note/CustomBlockNote/ui/slashMenu/slashMenuModel';
import { SlashMenuDropdownItems } from '@/components/Note/CustomBlockNote/ui/slashMenu/slashMenuView';
import { AppMenu } from '@/components/Overlay';
import { copyText } from '@/utils/browser/copyText';
import { blockHasType, defaultProps, editorHasBlockWithType } from '@blocknote/core';
import { SideMenuExtension, SuggestionMenu } from '@blocknote/core/extensions';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import {
  SideMenuController,
  useBlockNoteEditor,
  useExtension,
  useExtensionState,
} from '@blocknote/react';
import { useEventListener } from 'ahooks';
import clsx from 'clsx';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronRight,
  Copy,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
  Paintbrush,
  Plus,
  PlusSquare,
  Scissors,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState, type DragEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

type TextAlignment = 'left' | 'center' | 'right';
type BlockColorTarget = 'textColor' | 'backgroundColor';

const HIGHLIGHT_BLOCK_TYPE = 'highlightBlock';

const textAlignItems: Array<{ key: TextAlignment; icon: LucideIcon }> = [
  { key: 'left', icon: AlignLeft },
  { key: 'center', icon: AlignCenter },
  { key: 'right', icon: AlignRight },
];

function isBlockEmpty(block: NoteBlock) {
  const content = (block as { content?: unknown }).content;
  return Array.isArray(content) && content.length === 0;
}

function isHighlightBlock(block: NoteBlock) {
  return block.type === HIGHLIGHT_BLOCK_TYPE;
}

function blockSupportsTextColor(block: NoteBlock, editor: CustomBlockNoteEditor) {
  if (isHighlightBlock(block)) return true;
  return (
    blockHasType(block, editor, block.type, { textColor: 'string' }) &&
    editorHasBlockWithType(editor, block.type, { textColor: 'string' })
  );
}

function blockSupportsBackgroundColor(block: NoteBlock, editor: CustomBlockNoteEditor) {
  if (isHighlightBlock(block)) return true;
  return (
    blockHasType(block, editor, block.type, { backgroundColor: 'string' }) &&
    editorHasBlockWithType(editor, block.type, { backgroundColor: 'string' })
  );
}

function blockSupportsTextAlignment(block: NoteBlock, editor: CustomBlockNoteEditor) {
  return blockHasType(block, editor, block.type, {
    textAlignment: defaultProps.textAlignment,
  });
}

function getBlockProp(block: NoteBlock, prop: string) {
  return isRecord(block.props) && typeof block.props[prop] === 'string'
    ? block.props[prop]
    : undefined;
}

function getBlockColorProp(block: NoteBlock, target: BlockColorTarget) {
  if (isHighlightBlock(block)) {
    return getBlockProp(
      block,
      target === 'textColor' ? 'highlightTextColor' : 'highlightBackgroundColor'
    );
  }
  return getBlockProp(block, target);
}

function getBlockColorPropName(block: NoteBlock, target: BlockColorTarget) {
  if (isHighlightBlock(block)) {
    return target === 'textColor' ? 'highlightTextColor' : 'highlightBackgroundColor';
  }
  return target;
}

async function writeClipboardData(data: { html: string; text: string }) {
  if (navigator.clipboard?.write && 'ClipboardItem' in window) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([data.html], { type: 'text/html' }),
          'text/plain': new Blob([data.text], { type: 'text/plain' }),
        }),
      ]);
      return true;
    } catch {
      // 富文本写入失败时继续尝试纯文本。
    }
  }

  return copyText(data.text);
}

function MenuItemContent({
  icon: Icon,
  label,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      <span className={styles.menuIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className={styles.menuLabel}>{label}</span>
      <span className={styles.menuTrailing} aria-hidden="true">
        {trailing}
      </span>
    </>
  );
}

function MenuSwitch({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={styles.switchIndicator}
      data-selected={isSelected ? 'true' : undefined}
      aria-hidden="true"
    >
      <span className={styles.switchIndicatorThumb} />
    </span>
  );
}

function getEditorRoot(editor: CustomBlockNoteEditor): Document | ShadowRoot {
  const root = editor.domElement?.getRootNode();
  return root instanceof Document || root instanceof ShadowRoot ? root : document;
}

function findBlockContainer(
  root: ParentNode | null | undefined,
  blockId: string
): HTMLElement | null {
  if (!root) return null;

  for (const element of root.querySelectorAll<HTMLElement>(
    '[data-node-type="blockContainer"][data-id]'
  )) {
    if (element.getAttribute('data-id') === blockId) {
      return element;
    }
  }

  return null;
}

function resolveDragPreviewYOffset(
  event: DragEvent<HTMLElement>,
  sourceBlock: HTMLElement,
  dragPreview: HTMLElement,
  previewBlock: HTMLElement | null
): number {
  const sourceRect = sourceBlock.getBoundingClientRect();
  if (sourceRect.height <= 0) return 0;

  const previewRect = dragPreview.getBoundingClientRect();
  const previewHeight = previewRect.height > 0 ? previewRect.height : sourceRect.height;
  const sourceOffsetY = event.clientY - sourceRect.top;

  if (!previewBlock) {
    return Math.max(0, Math.min(previewHeight, sourceOffsetY));
  }

  const previewBlockRect = previewBlock.getBoundingClientRect();
  const scaleY = previewBlockRect.height > 0 ? previewBlockRect.height / sourceRect.height : 1;
  const offsetY = previewBlockRect.top - previewRect.top + sourceOffsetY * scaleY;

  return Math.max(0, Math.min(previewHeight, offsetY));
}

function alignDragPreviewWithPointer(
  event: DragEvent<HTMLElement>,
  editor: CustomBlockNoteEditor,
  block: NoteBlock
) {
  const dragPreview = getEditorRoot(editor).querySelector<HTMLElement>('.bn-drag-preview');
  const sourceBlock = findBlockContainer(editor.domElement, block.id);
  if (!event.dataTransfer || !dragPreview || !sourceBlock) return;
  const previewBlock = findBlockContainer(dragPreview, block.id);

  // BlockNote 默认把热点放在预览左上角；这里只修正纵向热点，让预览文字与鼠标保持同一水平线。
  event.dataTransfer.setDragImage(
    dragPreview,
    0,
    resolveDragPreviewYOffset(event, sourceBlock, dragPreview, previewBlock)
  );
}

function QuickBlockTypes({
  block,
  items,
  onSelect,
}: {
  block: NoteBlock;
  items: BlockTypeMenuItem[];
  onSelect: (item: BlockTypeMenuItem) => void;
}) {
  const { t } = useTranslation('note');
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.quickTypes} role="group" aria-label={t('editor.blockType.label')}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = blockMatchesBlockTypeItem(block, item);
        return (
          <AppIconButton
            key={item.key}
            icon={<Icon size={18} aria-hidden="true" />}
            label={item.label}
            size="sm"
            isActive={selected}
            className={styles.quickTypeButton}
            onPress={() => onSelect(item)}
          />
        );
      })}
    </div>
  );
}

function CustomSideMenu({
  hiddenByTextInteraction,
  plugins,
}: {
  hiddenByTextInteraction: boolean;
  plugins: readonly NoteContentPlugin[];
}) {
  const { t } = useTranslation('note');
  const editor = useBlockNoteEditor(blockNoteSchema);
  const sideMenu = useExtension(SideMenuExtension, { editor });
  const suggestionMenu = useExtension(SuggestionMenu, { editor });
  const extensionBlock = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  });
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const block = extensionBlock as NoteBlock | undefined;

  if (!block || !editor.isEditable) {
    return null;
  }

  const { allItems, quickItems } = getAvailableBlockTypeItems(editor);
  const slashInsertItems = sortSuggestionItemsForDisplay(
    getNoteSlashMenuItems(editor, plugins, NOTE_EDITOR_HIDDEN_DEFAULT_SLASH_MENU_KEY_SET).filter(
      (item) => resolveSlashMenuGroup(item) !== 'ai'
    )
  );
  const selectedBlockType = allItems.find((item) => blockMatchesBlockTypeItem(block, item));
  const blockIsEmpty = isBlockEmpty(block);
  const showBlockMenu = !blockIsEmpty || isHighlightBlock(block);
  const owner = notePluginRegistry.blockPlugins.get(block.type);
  const ownerSideMenuState = owner?.sideMenu?.inspect?.(
    block as unknown as Record<string, unknown>
  );
  const isStructured = ownerSideMenuState?.variant === 'structured';
  const SelectedBlockIcon = selectedBlockType?.icon ?? owner?.sideMenu?.icon;
  const canUseTextColor = blockSupportsTextColor(block, editor);
  const canUseBackgroundColor = blockSupportsBackgroundColor(block, editor);
  const canUseColor = canUseTextColor || canUseBackgroundColor;
  const canUseTextAlignment = blockSupportsTextAlignment(block, editor);
  const blockProps = isRecord(block.props) ? block.props : {};
  const textAlignment = canUseTextAlignment
    ? String(blockProps.textAlignment ?? defaultProps.textAlignment.default)
    : undefined;
  const contentActions = ownerSideMenuState?.actions ?? [];

  const closeMenu = () => {
    setOpen(false);
    sideMenu.unfreezeMenu();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      sideMenu.freezeMenu();
    } else {
      sideMenu.unfreezeMenu();
    }
  };

  const focusBlock = () => {
    editor.setTextCursorPosition(block);
    editor.focus();
  };

  const applyBlockType = (item: BlockTypeMenuItem) => {
    editor.focus();
    applyBlockTypeToBlocks(editor, [block], item);
    closeMenu();
  };

  const insertSlashItemBelow = (item: DefaultReactSuggestionItem) => {
    editor.focus();
    const insertedBlock = editor.insertBlocks(
      [createDefaultNoteBlock(notePluginRegistry) as NotePartialBlock],
      block,
      'after'
    )[0];
    editor.setTextCursorPosition(insertedBlock);
    item.onItemClick();
    closeMenu();
  };

  const openSlashBelow = () => {
    if (isBlockEmpty(block)) {
      editor.setTextCursorPosition(block);
      suggestionMenu.openSuggestionMenu('/');
      closeMenu();
      return;
    }

    const insertedBlock = editor.insertBlocks(
      [createDefaultNoteBlock(notePluginRegistry) as NotePartialBlock],
      block,
      'after'
    )[0];
    editor.setTextCursorPosition(insertedBlock);
    suggestionMenu.openSuggestionMenu('/');
    closeMenu();
  };

  const setTextAlignment = (alignment: TextAlignment) => {
    if (!canUseTextAlignment) {
      return;
    }
    editor.updateBlock(block, toBlockUpdate({ props: { textAlignment: alignment } }));
    closeMenu();
  };

  const nestBlock = (type: 'nest' | 'unnest') => {
    focusBlock();
    if (type === 'nest' && editor.canNestBlock()) {
      editor.nestBlock();
    }
    if (type === 'unnest' && editor.canUnnestBlock()) {
      editor.unnestBlock();
    }
    closeMenu();
  };

  const setBlockColor = (target: BlockColorTarget, color: ColorKey) => {
    const prop = getBlockColorPropName(block, target);
    editor.updateBlock(
      block,
      toBlockUpdate({
        props: { [prop]: color },
      })
    );
    closeMenu();
    window.setTimeout(() => editor.focus());
  };

  const resetBlockColor = () => {
    const textColorProp = getBlockColorPropName(block, 'textColor');
    const backgroundColorProp = getBlockColorPropName(block, 'backgroundColor');
    editor.updateBlock(
      block,
      toBlockUpdate({
        props: {
          ...(canUseTextColor ? { [textColorProp]: 'default' } : {}),
          ...(canUseBackgroundColor ? { [backgroundColorProp]: 'default' } : {}),
        },
      })
    );
    closeMenu();
    window.setTimeout(() => editor.focus());
  };

  const deleteBlock = () => {
    const nextFocusBlock = editor.getNextBlock(block) ?? editor.getPrevBlock(block);
    editor.removeBlocks([block]);
    if (nextFocusBlock) {
      editor.setTextCursorPosition(nextFocusBlock);
    }
    closeMenu();
    editor.focus();
  };

  const copyOrCutBlock = async (mode: 'copy' | 'cut') => {
    const blocks = [block as unknown as NotePartialBlock];
    const clipboardData = {
      html: exportNoteFullHtml(editor, notePluginRegistry, blocks),
      text: exportNoteMarkdown(editor, notePluginRegistry, blocks),
    };

    const copied = await writeClipboardData(clipboardData);
    if (copied && mode === 'cut') {
      deleteBlock();
      return;
    }

    closeMenu();
  };

  const applyContentAction = (actionId: string) => {
    const update = owner?.sideMenu?.apply?.(block as unknown as Record<string, unknown>, actionId);
    if (!update) return;
    editor.updateBlock(block, toBlockUpdate(update));
    closeMenu();
    window.setTimeout(() => editor.focus());
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    setDragging(true);
    sideMenu.blockDragStart(event, block);
    alignDragPreviewWithPointer(event, editor, block);
  };

  const handleDragEnd = () => {
    sideMenu.blockDragEnd();
    window.setTimeout(() => setDragging(false));
  };

  const indentAlignMenu = (
    <AppMenu.SubmenuTrigger>
      <AppMenu.Item
        id="indent-align"
        textValue={t('editor.indent.align')}
        className={styles.menuItem}
      >
        <MenuItemContent
          icon={AlignLeft}
          label={t('editor.indent.align')}
          trailing={<ChevronRight size={16} />}
        />
      </AppMenu.Item>
      <AppMenu.Popover className={styles.popover} placement="right top" bodyPadding="none">
        <AppMenu.Menu
          aria-label={t('editor.indent.align')}
          className={styles.menu}
          onAction={(key) => {
            const action = String(key);
            if (action === 'nest') {
              nestBlock('nest');
            }
            if (action === 'unnest') {
              nestBlock('unnest');
            }
            if (action.startsWith('align-')) {
              setTextAlignment(action.replace('align-', '') as TextAlignment);
            }
          }}
        >
          <AppMenu.Item
            id="nest"
            textValue={t('editor.indent.increase')}
            className={styles.menuItem}
          >
            <MenuItemContent icon={IndentIncrease} label={t('editor.indent.increase')} />
          </AppMenu.Item>
          <AppMenu.Item
            id="unnest"
            textValue={t('editor.indent.decrease')}
            className={styles.menuItem}
          >
            <MenuItemContent icon={IndentDecrease} label={t('editor.indent.decrease')} />
          </AppMenu.Item>
          {canUseTextAlignment
            ? textAlignItems.map((item) => (
                <AppMenu.Item
                  key={item.key}
                  id={`align-${item.key}`}
                  textValue={t(`editor.align.${item.key}`)}
                  className={styles.menuItem}
                >
                  <MenuItemContent
                    icon={item.icon}
                    label={t(`editor.align.${item.key}`)}
                    trailing={textAlignment === item.key ? <Check size={16} /> : null}
                  />
                </AppMenu.Item>
              ))
            : null}
        </AppMenu.Menu>
      </AppMenu.Popover>
    </AppMenu.SubmenuTrigger>
  );

  const colorMenu =
    canUseColor && !isStructured ? (
      <AppMenu.SubmenuTrigger>
        <AppMenu.Item id="colors" textValue={t('editor.color.label')} className={styles.menuItem}>
          <MenuItemContent
            icon={Paintbrush}
            label={t('editor.color.label')}
            trailing={<ChevronRight size={16} />}
          />
        </AppMenu.Item>
        <AppMenu.Popover className={styles.popover} placement="right top" bodyPadding="none">
          <ColorPaletteContent
            className={styles.colorPanel}
            text={
              canUseTextColor
                ? {
                    color: getBlockColorProp(block, 'textColor'),
                    onChange: (color) => setBlockColor('textColor', color),
                  }
                : undefined
            }
            background={
              canUseBackgroundColor
                ? {
                    color: getBlockColorProp(block, 'backgroundColor'),
                    onChange: (color) => setBlockColor('backgroundColor', color),
                  }
                : undefined
            }
            onReset={resetBlockColor}
          />
        </AppMenu.Popover>
      </AppMenu.SubmenuTrigger>
    ) : null;

  const structuredIndentMenu = (
    <AppMenu.SubmenuTrigger>
      <AppMenu.Item id="indent" textValue={t('editor.indent.label')} className={styles.menuItem}>
        <MenuItemContent
          icon={IndentIncrease}
          label={t('editor.indent.label')}
          trailing={<ChevronRight size={16} />}
        />
      </AppMenu.Item>
      <AppMenu.Popover className={styles.popover} placement="right top" bodyPadding="none">
        <AppMenu.Menu
          aria-label={t('editor.indent.label')}
          className={styles.menu}
          onAction={(key) => {
            const action = String(key);
            if (action === 'nest') {
              nestBlock('nest');
            }
            if (action === 'unnest') {
              nestBlock('unnest');
            }
          }}
        >
          <AppMenu.Item
            id="nest"
            textValue={t('editor.indent.increase')}
            className={styles.menuItem}
          >
            <MenuItemContent icon={IndentIncrease} label={t('editor.indent.increase')} />
          </AppMenu.Item>
          <AppMenu.Item
            id="unnest"
            textValue={t('editor.indent.decrease')}
            className={styles.menuItem}
          >
            <MenuItemContent icon={IndentDecrease} label={t('editor.indent.decrease')} />
          </AppMenu.Item>
        </AppMenu.Menu>
      </AppMenu.Popover>
    </AppMenu.SubmenuTrigger>
  );

  return (
    <div
      className={clsx('bn-side-menu', styles.sideMenu)}
      data-block-type={block.type}
      data-interaction-hidden={hiddenByTextInteraction && !dragging ? 'true' : undefined}
      {...Object.fromEntries(
        Object.entries(ownerSideMenuState?.attributes ?? {}).map(([key, value]) => [
          `data-${key}`,
          value,
        ])
      )}
    >
      {blockIsEmpty && !isHighlightBlock(block) ? (
        <AppIconButton
          icon={<Plus size={18} aria-hidden="true" />}
          label={t('sideMenu.addBlock')}
          size="sm"
          className={styles.sideMenuButton}
          onPress={openSlashBelow}
        />
      ) : null}
      {showBlockMenu ? (
        <div className={styles.dragHandleWrapper}>
          <button
            type="button"
            className={clsx(styles.sideMenuButton, styles.dragHandleButton)}
            draggable="true"
            aria-label={t('sideMenu.blockMenu')}
            onClick={() => {
              if (!dragging) {
                handleOpenChange(!open);
              }
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {SelectedBlockIcon ? (
              <SelectedBlockIcon
                size={16}
                className={styles.dragHandleTypeIcon}
                aria-hidden="true"
              />
            ) : null}
            <GripVertical size={16} aria-hidden="true" />
          </button>
          <AppMenu isOpen={open} onOpenChange={handleOpenChange}>
            <AppMenu.Trigger className={styles.dropdownAnchor} isDisabled aria-hidden="true">
              <span />
            </AppMenu.Trigger>
            <AppMenu.Popover
              className={styles.popover}
              placement="left top"
              offset={8}
              bodyPadding="none"
            >
              <div className={styles.menuSurface}>
                {!isStructured ? (
                  <QuickBlockTypes block={block} items={quickItems} onSelect={applyBlockType} />
                ) : null}
                <AppMenu.Menu
                  aria-label={t('sideMenu.blockMenu')}
                  className={styles.menu}
                  onAction={(key) => {
                    const action = String(key);
                    if (action === 'nest') {
                      nestBlock('nest');
                    }
                    if (action === 'unnest') {
                      nestBlock('unnest');
                    }
                    if (action === 'copy') {
                      void copyOrCutBlock('copy');
                    }
                    if (action === 'cut') {
                      void copyOrCutBlock('cut');
                    }
                    if (action === 'delete') {
                      deleteBlock();
                    }
                    if (action.startsWith('content:')) {
                      applyContentAction(action.slice('content:'.length));
                    }
                  }}
                >
                  {isStructured ? structuredIndentMenu : indentAlignMenu}
                  {!isStructured ? colorMenu : null}

                  <AppMenu.Section showDivider>
                    <AppMenu.Item
                      id="cut"
                      textValue={t('sideMenu.cut')}
                      className={styles.menuItem}
                    >
                      <MenuItemContent icon={Scissors} label={t('sideMenu.cut')} />
                    </AppMenu.Item>
                    <AppMenu.Item
                      id="copy"
                      textValue={t('sideMenu.copy')}
                      className={styles.menuItem}
                    >
                      <MenuItemContent icon={Copy} label={t('sideMenu.copy')} />
                    </AppMenu.Item>
                    <AppMenu.DangerItem
                      id="delete"
                      textValue={t('sideMenu.delete')}
                      className={styles.menuItem}
                    >
                      <MenuItemContent icon={Trash2} label={t('sideMenu.delete')} />
                    </AppMenu.DangerItem>
                  </AppMenu.Section>

                  {contentActions.length > 0 ? (
                    <AppMenu.Section showDivider>
                      {contentActions.map((action) => (
                        <AppMenu.Item
                          key={action.id}
                          id={`content:${action.id}`}
                          textValue={action.label}
                          className={styles.menuItem}
                        >
                          <MenuItemContent
                            icon={action.icon}
                            label={action.label}
                            trailing={
                              action.kind === 'toggle' ? (
                                <MenuSwitch isSelected={Boolean(action.selected)} />
                              ) : null
                            }
                          />
                        </AppMenu.Item>
                      ))}
                    </AppMenu.Section>
                  ) : null}

                  <AppMenu.Section showDivider>
                    <AppMenu.SubmenuTrigger>
                      <AppMenu.Item
                        id="insert-below"
                        textValue={t('sideMenu.addBelow')}
                        className={styles.menuItem}
                      >
                        <MenuItemContent
                          icon={PlusSquare}
                          label={t('sideMenu.addBelow')}
                          trailing={<ChevronRight size={16} />}
                        />
                      </AppMenu.Item>
                      <AppMenu.Popover
                        className={styles.popover}
                        placement="right top"
                        bodyPadding="none"
                      >
                        <AppMenu.Menu
                          aria-label={t('sideMenu.addBelow')}
                          className={styles.menu}
                          onAction={(key) => {
                            const item = slashInsertItems.find(
                              (_candidate, index) => `insert-slash-item-${index}` === String(key)
                            );
                            if (item) {
                              insertSlashItemBelow(item);
                            }
                          }}
                        >
                          <SlashMenuDropdownItems
                            items={slashInsertItems}
                            getItemId={(_item, index) => `insert-slash-item-${index}`}
                          />
                        </AppMenu.Menu>
                      </AppMenu.Popover>
                    </AppMenu.SubmenuTrigger>
                  </AppMenu.Section>
                </AppMenu.Menu>
              </div>
            </AppMenu.Popover>
          </AppMenu>
        </div>
      ) : null}
    </div>
  );
}

export default function NoteSideMenu({ plugins }: { plugins: readonly NoteContentPlugin[] }) {
  const readOnly = useNoteEditorReadOnlyContext();
  const editor = useBlockNoteEditor(blockNoteSchema);
  const [isPointerSelectingText, setIsPointerSelectingText] = useState(false);
  const handleEditorPointerDown = (event: Event) => {
    if (!(event instanceof globalThis.PointerEvent) || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('.bn-side-menu')) return;
    setIsPointerSelectingText(true);
  };
  const handlePointerSelectionEnd = () => setIsPointerSelectingText(false);

  useEventListener('pointerdown', handleEditorPointerDown, { target: editor.domElement });
  useEventListener('pointerup', handlePointerSelectionEnd);
  useEventListener('pointercancel', handlePointerSelectionEnd);

  if (readOnly) {
    return null;
  }

  return (
    <SideMenuController
      sideMenu={() => (
        <CustomSideMenu hiddenByTextInteraction={isPointerSelectingText} plugins={plugins} />
      )}
      floatingUIOptions={{
        useFloatingOptions: {
          placement: 'left-start',
        },
      }}
    />
  );
}
