import type { ChatPanelProps } from '@/components/ChatPanel/index.type';
import { AppAlertDialog } from '@/components/Overlay';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import ChatPanelBody from './ChatPanelBody';
import ChatPanelHeader from './ChatPanelHeader';
import styles from './style.module.less';
import { useChatPanelController } from './useChatPanelController';

function ChatPanel({
  collapsed,
  fullWidth = false,
  showHeader = true,
  onNewChat,
  resourceChat,
  agentDebug,
  showCollapseButton = true,
}: ChatPanelProps) {
  const { t } = useTranslation(['chat', 'common']);
  const controller = useChatPanelController({
    collapsed,
    fullWidth,
    onNewChat,
    resourceChat,
    agentDebug,
  });

  return (
    <>
      <div className={`${styles.panel} ${fullWidth ? styles.fullWidth : ''}`}>
        {showHeader ? (
          <ChatPanelHeader
            collapsed={collapsed}
            fullWidth={fullWidth}
            panelTitle={controller.panelTitle}
            sessionBarOpen={controller.sessionBarOpen}
            showCollapseButton={showCollapseButton}
            onCollapsePanel={controller.handleCollapsePanel}
            onNewChat={controller.handleNewChat}
            onToggleSessionBar={controller.handleToggleSessionBar}
          />
        ) : null}

        {!collapsed ? (
          <ChatPanelBody agentDebug={agentDebug} controller={controller} fullWidth={fullWidth} />
        ) : null}
      </div>
      <AppAlertDialog
        type="warning"
        isOpen={controller.isDebugSaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) controller.handleCancelDebugSend();
        }}
        title={t('panel.debugSave.title')}
        description={t('panel.debugSave.description')}
        cancelText={t('actions.cancel', { ns: 'common' })}
        confirmText={t('panel.debugSave.confirm')}
        isConfirmLoading={controller.savingDebugDraft || agentDebug?.isSaving}
        onConfirm={() => void controller.handleConfirmDebugSend()}
      />
    </>
  );
}

export default memo(ChatPanel);
