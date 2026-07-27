import ChatInput from './ChatInput';
import ChatSessionBar from './ChatSessionBar';
import type { ChatPanelAgentDebugConfig } from './index.type';
import MessageList from './MessageList';
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
    currentModel,
    currentSessionId,
    handleCloseSessionBar,
    handleSelectSession,
    handleSend,
    loadMoreHistoryMessages,
    loadingMoreHistory,
    messages,
    resourceChatContext,
    clearResourceChatContext,
    sending,
    sessionBarOpen,
    status,
    stop,
    ensureChatSession,
  } = controller;

  return (
    <div className={styles.panelBody}>
      <div
        className={styles.conversationPanel}
        hidden={sessionBarOpen}
        aria-hidden={sessionBarOpen}
      >
        <div className={styles.content}>
          <div className={styles.messageViewport}>
            <MessageList
              messages={messages}
              sessionId={currentSessionId}
              canLoadMoreHistory={canLoadMoreHistory}
              loadingMoreHistory={loadingMoreHistory}
              onLoadMoreHistory={loadMoreHistoryMessages}
              status={status}
              model={currentModel}
              fullWidth={fullWidth}
            />
          </div>
          <div className={styles.footerSlot}>
            <div className={styles.footer}>
              <ChatInput
                onSend={handleSend}
                getUploadSessionId={ensureChatSession}
                sending={sending}
                onStop={stop}
                contextPreview={resourceChatContext?.preview}
                onClearContext={clearResourceChatContext}
                injectedAgents={agentDebug ? [agentDebug.agent] : undefined}
                preferredAgent={agentDebug?.agent}
                fullWidth={fullWidth}
              />
            </div>
          </div>
        </div>
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
