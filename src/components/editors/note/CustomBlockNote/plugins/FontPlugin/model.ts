/**
 * 字体与字号的取值定义：行内 mark 的值、菜单选项、AI Diff 预览和外部 HTML 共用这一份映射。
 *
 * 字体只使用系统字体栈，不打包字体文件：仓库里没有附加的字体许可与体积成本，
 * 代价是每台机器实际渲染的字体由本地安装情况决定，靠 fallback 链逐级降级。
 */

export const FONT_SIZE_STYLE_TYPE = 'fontSize';
export const FONT_FAMILY_STYLE_TYPE = 'fontFamily';

/** 可选字号（px，升序）。16px 是笔记正文默认字号，只以 `default` 项出现，不写入 mark。 */
export const NOTE_FONT_SIZES_PX = [12, 14, 16, 18, 22, 28] as const;

export const NOTE_DEFAULT_FONT_SIZE_PX = 16;

export type NoteFontSizeValue = `${(typeof NOTE_FONT_SIZES_PX)[number]}` | 'default';

/** 菜单选项：mark 的值直接用 px 数字，默认字号用 `default` 表示。 */
export const NOTE_FONT_SIZE_VALUES: readonly NoteFontSizeValue[] = NOTE_FONT_SIZES_PX.map(
  (px): NoteFontSizeValue => (px === NOTE_DEFAULT_FONT_SIZE_PX ? 'default' : `${px}`)
);

/** 字体族预设：全部为系统字体栈，中文优先命中本地字库，未命中时降级到通用族。 */
export const NOTE_FONT_FAMILY_STACKS = {
  hei: '"Heiti SC", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", SimHei, sans-serif',
  serif: '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, STSong, serif',
  kai: '"Kaiti SC", STKaiti, KaiTi, 楷体, "Kaiti TC", serif',
  fangsong: 'FangSong, STFangsong, "FangSong_GB2312", 仿宋, serif',
  round: '"Yuanti SC", YouYuan, 圆体, sans-serif',
  timesNewRoman: '"Times New Roman", Times, "Songti SC", "Noto Serif CJK SC", SimSun, serif',
  arial:
    'Arial, "Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  georgia: 'Georgia, "Times New Roman", "Songti SC", "Noto Serif CJK SC", serif',
  garamond: 'Garamond, "EB Garamond", "Palatino Linotype", Georgia, serif',
  palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
  courierNew: '"Courier New", Courier, "SFMono-Regular", Menlo, "Songti SC", monospace',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
} as const;

export type NoteFontFamilyValue = keyof typeof NOTE_FONT_FAMILY_STACKS | 'default';

/** 菜单顺序：默认在最前，其余按中文排版习惯排列。 */
export const NOTE_FONT_FAMILY_VALUES: readonly NoteFontFamilyValue[] = [
  'default',
  'hei',
  'serif',
  'kai',
  'fangsong',
  'round',
  'timesNewRoman',
  'arial',
  'georgia',
  'garamond',
  'palatino',
  'courierNew',
  'mono',
];

export function getFontSizePx(value: string): number | undefined {
  const px = Number(value);
  return (NOTE_FONT_SIZES_PX as readonly number[]).includes(px) ? px : undefined;
}

export function getFontFamilyStack(value: string): string | undefined {
  return Object.hasOwn(NOTE_FONT_FAMILY_STACKS, value)
    ? NOTE_FONT_FAMILY_STACKS[value as keyof typeof NOTE_FONT_FAMILY_STACKS]
    : undefined;
}

/** 字号 mark 的视觉结果；未识别的取值（旧版本或被删除的 preset）不写任何样式。 */
export function applyFontSizeStyle(element: HTMLElement, value: string): void {
  const px = getFontSizePx(value);
  if (px === undefined) return;
  element.style.fontSize = `${px}px`;
}

export function applyFontFamilyStyle(element: HTMLElement, value: string): void {
  const stack = getFontFamilyStack(value);
  if (stack === undefined) return;
  element.style.fontFamily = stack;
}
