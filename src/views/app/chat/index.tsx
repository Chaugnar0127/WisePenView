import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import ChatPanel from '@/components/business/ChatPanel';
import { useCurrentChatSessionStore } from '@/components/business/ChatPanel/_store/useCurrentChatSessionStore';
import { clearNewChatSessionStore } from '@/components/business/ChatPanel/_store/useNewChatSessionStore';
import { useMainLayoutMobile } from '@/layouts/_common/useMainLayoutMobile';
import { cn } from '@/utils/cn';

import styles from './style.module.less';

function ChatPage() {
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>();
  const setCurrentSession = useCurrentChatSessionStore((s) => s.setCurrentSession);
  const clearCurrentSession = useCurrentChatSessionStore((s) => s.clearCurrentSession);
  // 与 MainLayout 同源：窄屏对齐侧栏 Drawer（Header + 非 fullWidth）。
  const isCompactChat = useMainLayoutMobile();

  /**
   * @wisepen-manual-effect
   * 执行时机：聊天页首次进入或路由会话 ID 变化时同步当前会话 store。
   * 不可替代原因：React Router 与 Zustand 是两个独立状态系统，需要在路由提交后同步。
   * cleanup：没有订阅或延迟任务，无需清理。
   */
  useEffect(() => {
    if (routeSessionId) {
      setCurrentSession({ id: routeSessionId, title: '' });
    } else {
      clearCurrentSession();
      clearNewChatSessionStore();
    }
  }, [clearCurrentSession, routeSessionId, setCurrentSession]);

  return (
    <div className={cn(styles.root, isCompactChat && styles.compact)}>
      <div className={styles.chatPanelHost}>
        <ChatPanel
          fullWidth={!isCompactChat}
          showHeader={isCompactChat}
          showCollapseButton={false}
        />
      </div>
    </div>
  );
}

export default ChatPage;
