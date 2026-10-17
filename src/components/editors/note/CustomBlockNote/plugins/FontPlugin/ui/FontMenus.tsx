import { useBlockNoteEditor, useEditorState } from '@blocknote/react';
import { Dropdown, Label } from '@heroui/react';
import { ALargeSmall, Type } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { blockNoteSchema } from '@/components/editors/note/CustomBlockNote/registry/noteEditorComposition';
import {
  type ButtonGroupChildProps,
  ToolbarButton,
} from '@/components/editors/note/CustomBlockNote/ui/toolbar/components/ToolbarButton';
import {
  blockHasInlineContent,
  getSelectedBlocks,
  stringStyleExists,
  toStyleUpdate,
} from '@/components/editors/note/CustomBlockNote/ui/toolbar/utils';

import {
  FONT_FAMILY_STYLE_TYPE,
  FONT_SIZE_STYLE_TYPE,
  getFontFamilyStack,
  NOTE_DEFAULT_FONT_SIZE_PX,
  NOTE_FONT_FAMILY_VALUES,
  NOTE_FONT_SIZE_VALUES,
} from '../model';

interface StyleMenuOption {
  key: string;
  label: string;
  /** 选项预览样式，例如用该字体族的名字展示自己 */
  previewStyle?: CSSProperties;
}

interface StringStyleMenuProps extends ButtonGroupChildProps {
  styleType: string;
  label: string;
  icon: ReactNode;
  options: readonly StyleMenuOption[];
}

/**
 * 读写取值型样式的通用菜单：选中文字后从预设里挑一项，选 `default` 则摘掉 mark。
 * 只在 schema 注册了对应 styleSpec 时才渲染，未注册的样式不会在工具栏露出。
 */
function StringStyleMenu({
  styleType,
  label,
  icon,
  options,
  __button_group_child: isButtonGroupChild,
}: StringStyleMenuProps) {
  const editor = useBlockNoteEditor(blockNoteSchema);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable || !getSelectedBlocks(editor).find(blockHasInlineContent)) {
        return undefined;
      }
      if (!stringStyleExists(editor, styleType)) {
        return undefined;
      }
      const activeStyles = editor.getActiveStyles() as Record<string, unknown>;
      const value = activeStyles[styleType];
      return { value: typeof value === 'string' ? value : 'default' };
    },
  });

  if (!state) {
    return null;
  }

  const applyValue = (key: string) => {
    editor.focus();
    if (key === 'default') {
      editor.removeStyles(toStyleUpdate({ [styleType]: 'default' }));
    } else {
      editor.addStyles(toStyleUpdate({ [styleType]: key }));
    }
    window.setTimeout(() => editor.focus());
  };

  return (
    <Dropdown>
      <ToolbarButton
        __button_group_child={isButtonGroupChild}
        icon={icon}
        label={label}
        isActive={state.value !== 'default'}
      />
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label={label}
          selectionMode="single"
          selectedKeys={[state.value]}
          onAction={(key) => applyValue(String(key))}
        >
          {options.map((option) => (
            <Dropdown.Item key={option.key} id={option.key} textValue={option.label}>
              <Label>
                {option.previewStyle ? (
                  <span style={option.previewStyle}>{option.label}</span>
                ) : (
                  option.label
                )}
              </Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function FontSizeMenu(buttonGroupProps: ButtonGroupChildProps) {
  const { t } = useTranslation('note');
  const options = NOTE_FONT_SIZE_VALUES.map((value) => ({
    key: value,
    // 字号菜单直接列为数值；默认档靠后缀标明，避免用户猜哪一个是正文尺寸。
    label:
      value === 'default'
        ? `${NOTE_DEFAULT_FONT_SIZE_PX}px${t('editor.fontSize.defaultSuffix')}`
        : `${value}px`,
  }));

  return (
    <StringStyleMenu
      {...buttonGroupProps}
      styleType={FONT_SIZE_STYLE_TYPE}
      label={t('editor.fontSize.label')}
      icon={<ALargeSmall size={20} aria-hidden="true" />}
      options={options}
    />
  );
}

export function FontFamilyMenu(buttonGroupProps: ButtonGroupChildProps) {
  const { t } = useTranslation('note');
  const options = NOTE_FONT_FAMILY_VALUES.map((value) => {
    const stack = getFontFamilyStack(value);
    return {
      key: value,
      label: t(`editor.fontFamily.${value}`),
      ...(stack ? { previewStyle: { fontFamily: stack } } : {}),
    };
  });

  return (
    <StringStyleMenu
      {...buttonGroupProps}
      styleType={FONT_FAMILY_STYLE_TYPE}
      label={t('editor.fontFamily.label')}
      icon={<Type size={20} aria-hidden="true" />}
      options={options}
    />
  );
}
