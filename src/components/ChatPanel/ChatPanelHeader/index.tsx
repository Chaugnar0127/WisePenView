import AppIconButton from '@/components/Button/AppIconButton';
import clsx from 'clsx';
import { History, PanelRightClose, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../style.module.less';
import type { ChatPanelHeaderProps } from './index.type';

function ChatPanelHeader({
  collapsed,
  fullWidth,
  panelTitle,
  sessionBarOpen,
  showCollapseButton,
  onCollapsePanel,
  onNewChat,
  onToggleSessionBar,
}: ChatPanelHeaderProps) {
  const { t } = useTranslation('chat');
  const sessionBarLabel = sessionBarOpen
    ? t('panel.sessionList.close')
    : t('panel.sessionList.open');

  return (
    <div className={clsx(styles.header, collapsed && styles.collapsedHeader)}>
      <div className={styles.headerLeft}>
        {!collapsed && !fullWidth && showCollapseButton ? (
          <AppIconButton
            icon={<PanelRightClose size={18} aria-hidden="true" />}
            label={t('panel.collapse')}
            onPress={onCollapsePanel}
          />
        ) : null}
        {!collapsed ? (
          <div className={styles.titleWrap}>
            <div className={styles.title}>{panelTitle}</div>
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className={styles.headerRight}>
          <AppIconButton
            icon={<Plus size={18} aria-hidden="true" />}
            label={t('panel.create')}
            onPress={onNewChat}
          />
          <AppIconButton
            icon={<History size={18} aria-hidden="true" />}
            label={sessionBarLabel}
            isActive={sessionBarOpen}
            onPress={onToggleSessionBar}
          />
        </div>
      ) : null}
    </div>
  );
}

export default ChatPanelHeader;
