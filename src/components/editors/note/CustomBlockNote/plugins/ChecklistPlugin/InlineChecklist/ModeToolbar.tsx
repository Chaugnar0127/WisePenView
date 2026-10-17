import { clsx } from 'clsx';
import { Link2, Link2Off, Paintbrush } from 'lucide-react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import AppIconButton from '@/components/base/Button/AppIconButton';
import { ColorPaletteContent } from '@/components/editors/note/CustomBlockNote/ui/editorMenus/colorPalette';

import type { InlineChecklistModeToolbarProps } from './index.type';
import styles from './style.module.less';

type LinkToolbarTextButtonProps = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
};

type LinkToolbarIconButtonProps = {
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
};

function stopEditorMouseDown(event: ReactMouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function LinkToolbarTextButton({ label, isActive, onPress }: LinkToolbarTextButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.linkToolbarTextBtn, isActive && styles.linkToolbarTextBtnActive)}
      aria-label={label}
      aria-pressed={isActive}
      onMouseDown={stopEditorMouseDown}
      onClick={onPress}
    >
      {label}
    </button>
  );
}

function LinkToolbarIconButton({
  label,
  icon,
  isActive,
  isDisabled,
  onPress,
}: LinkToolbarIconButtonProps) {
  return (
    <AppIconButton
      label={label}
      icon={icon}
      size="sm"
      variant="ghost"
      isActive={isActive}
      isDisabled={isDisabled}
      className={styles.linkToolbarIconBtn}
      tooltip={{ placement: 'top', showArrow: true, offset: 6 }}
      onMouseDown={stopEditorMouseDown}
      onPress={onPress}
    />
  );
}

export function InlineChecklistModeToolbar({
  mode,
  borderColor,
  backgroundColor,
  colorPanelOpen,
  canJoinPrevious,
  onModeChange,
  onBorderColorChange,
  onBackgroundColorChange,
  onResetColors,
  onToggleColorPanel,
  onJoinPrevious,
  onSplitGroup,
}: InlineChecklistModeToolbarProps) {
  const { t } = useTranslation('note');
  const hasCustomColor = borderColor !== 'default' || backgroundColor !== 'default';

  return (
    <div onMouseDown={stopEditorMouseDown}>
      <div className={styles.linkToolbar} role="toolbar" aria-label={t('checklist.modeLabel')}>
        <LinkToolbarTextButton
          label={t('checklist.modeCheckbox')}
          isActive={mode === 'checkbox'}
          onPress={() => onModeChange('checkbox')}
        />
        <LinkToolbarTextButton
          label={t('checklist.modeRadio')}
          isActive={mode === 'radio'}
          onPress={() => onModeChange('radio')}
        />
        <span className={styles.linkToolbarDivider} aria-hidden="true" />
        <LinkToolbarIconButton
          label={t('checklist.color')}
          icon={<Paintbrush size={18} />}
          isActive={colorPanelOpen || hasCustomColor}
          onPress={onToggleColorPanel}
        />
        {mode === 'radio' ? (
          <>
            <span className={styles.linkToolbarDivider} aria-hidden="true" />
            <LinkToolbarIconButton
              label={t('checklist.joinPreviousGroup')}
              icon={<Link2 size={18} />}
              isDisabled={!canJoinPrevious}
              onPress={onJoinPrevious}
            />
            <LinkToolbarIconButton
              label={t('checklist.splitGroup')}
              icon={<Link2Off size={18} />}
              onPress={onSplitGroup}
            />
          </>
        ) : null}
      </div>
      {colorPanelOpen ? (
        <div className={styles.colorPanelWrap}>
          <ColorPaletteContent
            border={{
              color: borderColor,
              onChange: onBorderColorChange,
            }}
            background={{
              color: backgroundColor,
              onChange: onBackgroundColorChange,
            }}
            onReset={onResetColors}
          />
        </div>
      ) : null}
    </div>
  );
}
