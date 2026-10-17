import { ColorSwatchPicker } from '@heroui/react';
import { clsx } from 'clsx';
import { Baseline } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/base/Button';

import {
  colorItems,
  type ColorKey,
  findColorItemByPickerValue,
  getColorItem,
  getColorItemLabel,
} from './colorPaletteData';
import styles from './style.module.less';

interface ColorPaletteSectionConfig {
  color?: string;
  onChange: (color: ColorKey) => void;
  /** 覆盖默认分区标题（如「边框颜色」） */
  title?: string;
}

interface ColorPaletteContentProps {
  text?: ColorPaletteSectionConfig;
  /** 边框色：样式同字体色条，标题默认为「边框颜色」 */
  border?: ColorPaletteSectionConfig;
  background?: ColorPaletteSectionConfig;
  onReset?: () => void;
  className?: string;
}

type ColorSectionMode = 'text' | 'border' | 'background';

function ColorSection({
  title,
  selectedColor,
  mode,
  onSelect,
}: {
  title: string;
  selectedColor?: string;
  mode: ColorSectionMode;
  onSelect: (color: ColorKey) => void;
}) {
  const selectedItem = getColorItem(selectedColor);

  return (
    <div className={styles.colorSection}>
      <div className={styles.colorSectionTitle}>{title}</div>
      <ColorSwatchPicker
        aria-label={title}
        className={styles.colorSwatchPicker}
        layout="grid"
        value={selectedItem.value}
        onChange={(color) => {
          const item = findColorItemByPickerValue(color.toString('hex'));
          if (item) {
            onSelect(item.key);
          }
        }}
      >
        {colorItems.map((item) => (
          <ColorSwatchPicker.Item
            key={`${mode}-${item.key}`}
            color={item.value}
            aria-label={`${title}${getColorItemLabel(item)}`}
            className={({ isSelected }) =>
              clsx(styles.colorSwatchItem, isSelected && styles.colorSwatchSelected)
            }
            onPress={() => onSelect(item.key)}
          >
            {mode === 'background' ? (
              <span className={clsx(styles.colorBackgroundPreview, item.backgroundClassName)} />
            ) : mode === 'border' ? (
              <span
                className={clsx(styles.colorBorderPreview, item.textClassName)}
                aria-hidden="true"
              />
            ) : (
              <Baseline
                size={20}
                className={clsx(styles.colorTextPreview, item.textClassName)}
                aria-hidden="true"
              />
            )}
          </ColorSwatchPicker.Item>
        ))}
      </ColorSwatchPicker>
    </div>
  );
}

export function ColorPaletteContent({
  text,
  border,
  background,
  onReset,
  className,
}: ColorPaletteContentProps) {
  const { t } = useTranslation('note');
  return (
    <div className={clsx(styles.colorPanel, className)}>
      {text ? (
        <ColorSection
          title={text.title ?? t('editor.color.text')}
          selectedColor={text.color}
          mode="text"
          onSelect={text.onChange}
        />
      ) : null}
      {border ? (
        <ColorSection
          title={border.title ?? t('editor.color.border')}
          selectedColor={border.color}
          mode="border"
          onSelect={border.onChange}
        />
      ) : null}
      {background ? (
        <ColorSection
          title={background.title ?? t('editor.color.background')}
          selectedColor={background.color}
          mode="background"
          onSelect={background.onChange}
        />
      ) : null}
      {onReset ? (
        <AppButton
          variant="outline"
          size="sm"
          className={styles.resetColorButton}
          onPress={onReset}
        >
          {t('editor.color.reset')}
        </AppButton>
      ) : null}
    </div>
  );
}
