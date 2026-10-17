import { createStyleSpec, type StyleConfig, type StyleSpec } from '@blocknote/core';

import type { NotePluginBundle, NoteStylePlugin } from '../../registry/types';
import {
  applyFontFamilyStyle,
  applyFontSizeStyle,
  FONT_FAMILY_STYLE_TYPE,
  FONT_SIZE_STYLE_TYPE,
} from './model';

/**
 * 样式插件统一声明为 `propSchema: 'string'` 的 mark：取值是预设 key，而不是任意数值。
 * render 与 toExternalHTML 写同一份行内样式，因此正文、AI Diff 预览、
 * 复制到外部的 HTML 和打印出来的效果是同一套结果。
 */
function createStringStylePlugin(params: {
  id: string;
  type: string;
  applyStyle: (element: HTMLElement, value: string) => void;
}): NoteStylePlugin {
  const { id, type, applyStyle } = params;
  const renderStyle = (value: string) => {
    const span = document.createElement('span');
    applyStyle(span, value);
    return { dom: span, contentDOM: span };
  };

  const spec: StyleSpec<StyleConfig> = createStyleSpec(
    { type, propSchema: 'string' },
    { render: renderStyle, toExternalHTML: renderStyle }
  );

  return {
    kind: 'style',
    id,
    type,
    spec,
    aiDiff: { applyTextStyle: applyStyle },
  };
}

export const fontSizeStylePlugin = createStringStylePlugin({
  id: 'style.fontSize',
  type: FONT_SIZE_STYLE_TYPE,
  applyStyle: applyFontSizeStyle,
});

export const fontFamilyStylePlugin = createStringStylePlugin({
  id: 'style.fontFamily',
  type: FONT_FAMILY_STYLE_TYPE,
  applyStyle: applyFontFamilyStyle,
});

/** 行内字体与字号：只改选中文字的排版，不新增 block / inlineContent。 */
export const fontPlugin: NotePluginBundle = {
  kind: 'bundle',
  id: 'font',
  children: [fontSizeStylePlugin, fontFamilyStylePlugin],
};
