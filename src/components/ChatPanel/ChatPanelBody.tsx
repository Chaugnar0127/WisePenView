import ChatInput from './ChatInput';
import ChatSessionBar from './ChatSessionBar';
import type { ChatPanelAgentDebugConfig } from './index.type';
import MessageList from './MessageList';
import Welcome from './MessageList/Welcome';
import styles from './style.module.less';
import type { ChatPanelController } from './useChatPanelController';

interface ChatPanelBodyProps {
  agentDebug?: ChatPanelAgentDebugConfig;
  controller: ChatPanelController;
  fullWidth: boolean;
}

function ChatPanelBody({ agentDebug, controller, fullWidth }: ChatPanelBodyProps) {
  const {
    canLoadMoreHistory,
    cancelling,
    currentModel,
    currentSessionId,
    handleCancel,
    handleCloseSessionBar,
    handleSelectSession,
    handleSend,
    handleToolApprovalDecision,
    loadMoreHistoryMessages,
    loadingInitialHistory,
    loadingMoreHistory,
    messages,
    promoteDraftToolSelection,
    resourceChatContext,
    clearResourceChatContext,
    sessionBarOpen,
    status,
    toolApprovalDecisions,
    ensureChatSession,
  } = controller;
  const sending = cancelling || status === 'submitted' || status === 'streaming';
  const isWelcome = messages.length === 0 && !loadingInitialHistory;

  return (
    <div className={styles.panelBody}>
      <div
        className={styles.conversationPanel}
        data-welcome={isWelcome ? 'true' : 'false'}
        hidden={sessionBarOpen}
      >
        <div className={styles.messageViewport}>
          <MessageList
            messages={messages}
            sessionId={currentSessionId}
            canLoadMoreHistory={canLoadMoreHistory}
            loadingInitialHistory={loadingInitialHistory}
            loadingMoreHistory={loadingMoreHistory}
            onLoadMoreHistory={loadMoreHistoryMessages}
            status={status}
            model={currentModel}
            fullWidth={fullWidth}
            approvalDecisions={toolApprovalDecisions}
            approvalSubmitting={status === 'submitted' || status === 'streaming'}
            onApprovalDecision={handleToolApprovalDecision}
          />
        </div>

        <div className={styles.composerCluster}>
          <div
            className={styles.welcomeSlot}
            data-visible={isWelcome ? 'true' : 'false'}
            aria-hidden={!isWelcome}
          >
            <div className={styles.welcomeSlotInner}>
              <Welcome />
            </div>
          </div>

          <div className={styles.footerSlot}>
            <div className={styles.inputColumn}>
              <ChatInput
                onSend={handleSend}
                getUploadSessionId={ensureChatSession}
                sending={sending}
                sessionId={currentSessionId}
                promoteDraftToolSelection={promoteDraftToolSelection}
                onCancel={cancelling ? undefined : handleCancel}
                isAuthenticated={controller.isAuthenticated}
                onRequireLogin={controller.requireLogin}
                contextPreview={resourceChatContext?.preview}
                onClearContext={clearResourceChatContext}
                injectedAgents={agentDebug ? [agentDebug.agent] : undefined}
                preferredAgent={agentDebug?.agent}
                fullWidth={fullWidth}
              />
            </div>
          </div>
        </div>

        <div className={styles.composerBottomSpacer} aria-hidden />
      </div>

      {sessionBarOpen ? (
        <ChatSessionBar
          activeSessionId={currentSessionId}
          onClose={handleCloseSessionBar}
          onSelectSession={handleSelectSession}
        />
      ) : null}
    </div>
  );
}

export default ChatPanelBody;
