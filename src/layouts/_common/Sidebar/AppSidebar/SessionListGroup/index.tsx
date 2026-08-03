import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import { useNewChatSessionStore } from '@/components/ChatPanel/_store/useNewChatSessionStore';
import { useChatService } from '@/domains';
import type { ChatSession } from '@/domains/Chat';
import { parseErrorMessage } from '@/utils/error';
import { Button, ListBox, ListBoxItem, ListBoxSection, toast } from '@heroui/react';
import { useMemoizedFn, useRequest } from 'ahooks';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSidebarSessionHistoryStore } from '../_store/useSidebarSessionHistoryStore';
import styles from '../AppSidebarTabs/style.module.less';
import SessionMenuItem from '../SessionMenuItem';
import type { SessionListGroupProps } from './index.type';

const SESSION_PAGE_SIZE = 20;

const useSessionListGroup = () => {
  const chatService = useChatService();
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const setCurrentSession = useCurrentChatSessionStore((state) => state.setCurrentSession);
  const clearCurrentSession = useCurrentChatSessionStore((state) => state.clearCurrentSession);
  const sessionItems = useSidebarSessionHistoryStore((state) => state.sessionItems);
  const sessionPage = useSidebarSessionHistoryStore((state) => state.sessionPage);
  const sessionTotalPage = useSidebarSessionHistoryStore((state) => state.sessionTotalPage);
  const setSessionPageResult = useSidebarSessionHistoryStore((state) => state.setSessionPageResult);
  const removeSession = useSidebarSessionHistoryStore((state) => state.removeSession);
  const navigate = useNavigate();

  const { runAsync: runListSessions, loading: sessionListLoading } = useRequest(
    async (page: number) =>
      chatService.listSessions({
        page,
        size: SESSION_PAGE_SIZE,
      }),
    {
      manual: true,
    }
  );

  const loadSessionPage = async (page: number, append: boolean) => {
    if (append) {
      setLoadingMoreSessions(true);
    }
    try {
      const payload = await runListSessions(page);
      // 始终以 store 最新 sessionId 为准，避免闭包里读到旧值后回写错误会话。
      const latestSessionId = useCurrentChatSessionStore.getState().currentSessionId;
      if (latestSessionId) {
        const currentSession = payload.list.find((item) => item.id === latestSessionId);
        if (currentSession) {
          setCurrentSession({ id: currentSession.id, title: currentSession.title });
        }
      }
      setSessionPageResult(payload, append);
    } catch (err) {
      toast.danger(parseErrorMessage(err));
    } finally {
      if (append) {
        setLoadingMoreSessions(false);
      }
    }
  };

  const refresh = useMemoizedFn(async () => {
    await loadSessionPage(1, false);
  });

  const hasMoreSessions = sessionPage < sessionTotalPage;

  const handleDeleted = (sessionId: string) => {
    if (currentSessionId === sessionId) {
      clearCurrentSession();
    }
    removeSession(sessionId);
    useNewChatSessionStore.getState().clearNewChatSessionById(sessionId);
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSession({ id: session.id, title: session.title });
    navigate(`/app/chat/${session.id}`);
  };

  const loadMoreSessions = () => {
    if (loadingMoreSessions || !hasMoreSessions) return;
    void loadSessionPage(sessionPage + 1, true);
  };

  return {
    hasMoreSessions,
    handleDeleted,
    loadMoreSessions,
    loadingMoreSessions,
    refresh,
    selectSession,
    sessionItems,
    sessionListLoading,
  };
};

function SessionListGroup({ selectedKeys, refreshVersion = 0 }: SessionListGroupProps) {
  const { t } = useTranslation('chat');
  const {
    handleDeleted,
    hasMoreSessions,
    loadMoreSessions,
    loadingMoreSessions,
    refresh,
    selectSession,
    sessionItems,
    sessionListLoading,
  } = useSessionListGroup();

  /**
   * @wisepen-manual-effect
   * 执行时机：组件挂载或外部刷新版本递增时重新加载会话列表。
   * 不可替代原因：列表数据来自服务端，刷新版本是父组件可声明的同步信号。
   * cleanup：请求由 ahooks 管理，无额外订阅需要清理。
   */
  useEffect(() => {
    void refresh();
  }, [refresh, refreshVersion]);

  return (
    <ListBox
      aria-label={t('session.listAria')}
      selectionMode="single"
      className={styles.sessionMenu}
      selectedKeys={selectedKeys}
    >
      <ListBoxSection id="recent-session" className={styles.sessionSection}>
        {sessionListLoading && sessionItems.length === 0 ? (
          <ListBoxItem
            key="session-loading"
            id="session-loading"
            textValue={t('session.loading')}
            isDisabled
            className={styles.sessionItem}
          >
            {t('session.loading')}
          </ListBoxItem>
        ) : (
          <>
            {sessionItems.length === 0 ? (
              <ListBoxItem
                key="empty-normal-session"
                id="empty-normal-session"
                textValue={t('session.empty')}
                isDisabled
                className={styles.sessionItem}
              >
                {t('session.empty')}
              </ListBoxItem>
            ) : (
              sessionItems.map((session) => (
                <ListBoxItem
                  key={session.id}
                  id={`session-${session.id}`}
                  textValue={session.title || t('session.untitled')}
                  className={clsx(styles.sessionItem, styles.sessionItemWithActions)}
                  onPress={() => selectSession(session)}
                >
                  <SessionMenuItem
                    session={session}
                    onUpdated={refresh}
                    onDeleted={handleDeleted}
                  />
                </ListBoxItem>
              ))
            )}
            {(hasMoreSessions || loadingMoreSessions) && (
              <ListBoxItem
                key="session-load-more"
                id="session-load-more"
                textValue={hasMoreSessions ? t('session.loadMore') : t('session.noMore')}
                isDisabled
                className={styles.sessionItem}
              >
                <Button
                  variant="secondary"
                  isDisabled={loadingMoreSessions}
                  className={styles.sessionLoadMoreBtn}
                  onPress={() => {
                    loadMoreSessions();
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  {hasMoreSessions ? t('session.loadMore') : t('session.noMore')}
                </Button>
              </ListBoxItem>
            )}
          </>
        )}
      </ListBoxSection>
    </ListBox>
  );
}

SessionListGroup.displayName = 'SessionListGroup';

export default SessionListGroup;
