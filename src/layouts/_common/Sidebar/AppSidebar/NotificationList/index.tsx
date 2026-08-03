import { Empty, Spin } from '@/components/Feedback';
import { useMessageService } from '@/domains';
import type { UserMessage } from '@/domains/Message';
import { parseErrorMessage } from '@/utils/error';
import { formatTimestampToDateTime } from '@/utils/format/formatTime';
import { extractMarkdownPlainText } from '@/utils/markdown/extractMarkdownPlainText';
import { ListBox, ListBoxItem, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import clsx from 'clsx';
import { BellDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './style.module.less';

const MESSAGE_LIST_SIZE = 50;

const getMessageTypeLabel = (
  message: UserMessage,
  t: ReturnType<typeof useTranslation<'message'>>['t']
) => {
  const key = message.messageType;
  if (key === 'SYSTEM' || key === 'NORMAL' || key === 'GROUP') {
    return t(`message:type.${key}`);
  }
  return key || t('message:type.NORMAL');
};

function NotificationList() {
  const { t } = useTranslation(['shell', 'message']);
  const messageService = useMessageService();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedMessageIdMatch = location.pathname.match(/^\/app\/notifications\/([^/]+)/);
  const selectedMessageId = selectedMessageIdMatch
    ? decodeURIComponent(selectedMessageIdMatch[1])
    : undefined;

  const { data, loading, refresh } = useRequest(
    () => messageService.listUserMessages({ page: 1, size: MESSAGE_LIST_SIZE }),
    {
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );

  const { runAsync: readMessage } = useRequest(
    (messageId: string) => messageService.readMessage({ messageId }),
    {
      manual: true,
      onSuccess: () => refresh(),
    }
  );

  const handleMessagePress = async (message: UserMessage) => {
    if (!message.read) {
      try {
        await readMessage(message.messageId);
      } catch {
        toast.warning(t('shell:sidebar.notificationsReadFailed'));
      }
    }
    navigate(`/app/notifications/${encodeURIComponent(message.messageId)}`);
  };

  const messages = data?.messages ?? [];

  if (loading) {
    return (
      <div className={styles.state}>
        <Spin size="small" tip={t('shell:sidebar.notificationsLoading')} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.state}>
        <Empty
          description={t('shell:sidebar.notificationsEmpty')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <ListBox
        aria-label={t('shell:sidebar.notifications')}
        selectionMode="none"
        className={styles.list}
        onAction={(key) => {
          const message = messages.find((item) => item.messageId === String(key));
          if (message) void handleMessagePress(message);
        }}
      >
        {messages.map((message) => {
          const isSelected = message.messageId === selectedMessageId;
          const title = message.title || t('message:page.untitled');
          const preview = extractMarkdownPlainText(message.content);
          return (
            <ListBoxItem
              key={message.messageId}
              id={message.messageId}
              textValue={title}
              aria-current={isSelected ? 'page' : undefined}
              className={clsx(styles.item, isSelected && styles.itemSelected)}
            >
              <span className={styles.itemHeader}>
                <span className={styles.title} title={title}>
                  {!message.read ? <BellDot size={14} aria-hidden="true" /> : null}
                  {title}
                </span>
                <span className={clsx(styles.status, !message.read && styles.statusUnread)}>
                  {message.read
                    ? t('message:page.readStatus.read')
                    : t('message:page.readStatus.unread')}
                </span>
              </span>
              <span className={styles.content}>{preview}</span>
              <span className={styles.meta}>
                {getMessageTypeLabel(message, t)} · {formatTimestampToDateTime(message.createTime)}
              </span>
            </ListBoxItem>
          );
        })}
      </ListBox>
    </div>
  );
}

export default NotificationList;
