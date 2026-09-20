import ChatPanel from '@/components/business/ChatPanel';
import { useMainShell } from '@/layouts/MainShell/MainShellContext';
import { cn } from '@/utils/cn';

import styles from './style.module.less';

function ChatPage() {
  // 与应用壳同源：窄屏用非 fullWidth 面板布局；/chat 不展示 ChatPanel Header。
  const { isMobileLayout: isCompactChat } = useMainShell();

  return (
    <div className={cn(styles.root, isCompactChat && styles.compact)}>
      <div className={styles.chatPanelHost}>
        <ChatPanel fullWidth={!isCompactChat} showHeader={false} showCollapseButton={false} />
      </div>
    </div>
  );
}

export default ChatPage;
