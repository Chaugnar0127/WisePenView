import { EmptyState, LoadingState, ResultState } from '@/components/Feedback';
import Markdown from '@/components/Markdown';
import { useMessageService } from '@/domains';
import type { UserMessage } from '@/domains/Message';
import { parseErrorMessage } from '@/utils/error';
import { formatTimestampToDateTime } from '@/utils/format/formatTime';
import { Button, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { ExternalLink, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './style.module.less';

const MESSAGE_PAGE_SIZE = 100;

const resolveMessageTypeLabel = (
  message: UserMessage,
  t: ReturnType<typeof useTranslation<'message'>>['t']
) => {
  const key = message.messageType;
  if (key === 'SYSTEM' || key === 'NORMAL' || key === 'GROUP') {
    return t(`type.${key}`);
  }
  return key || t('type.NORMAL');
};

function NotificationsPage() {
  const { t } = useTranslation('message');
  const messageService = useMessageService();
  const navigate = useNavigate();
  const { messageId: routeMessageId } = useParams<{ messageId: string }>();
  const selectedMessageId = routeMessageId ? decodeURIComponent(routeMessageId) : undefined;

  const messagesRequest = useRequest(() =>
    messageService.listUserMessages({ page: 1, size: MESSAGE_PAGE_SIZE })
  );

  const selectedMessage = messagesRequest.data?.messages.find(
    (message) => message.messageId === selectedMessageId
  );

  useRequest(
    async () => {
      if (!selectedMessageId) return;
      await messageService.readMessage({ messageId: selectedMessageId });
    },
    {
      ready: Boolean(selectedMessageId),
      refreshDeps: [selectedMessageId],
      onSuccess: () => messagesRequest.refresh(),
      onError: (error: unknown) => toast.warning(parseErrorMessage(error)),
    }
  );

  const handleOpenJumpUrl = () => {
    if (!selectedMessage?.jumpUrl) return;
    if (/^https?:\/\//i.test(selectedMessage.jumpUrl)) {
      window.open(selectedMessage.jumpUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(selectedMessage.jumpUrl);
  };

  if (messagesRequest.loading) {
    return (
      <div className={styles.pageContainer}>
        <LoadingState label={t('page.loading')} />
      </div>
    );
  }

  if (messagesRequest.error) {
    return (
      <div className={styles.pageContainer}>
        <ResultState
          status="error"
          title={t('page.loadFailed')}
          subTitle={parseErrorMessage(messagesRequest.error)}
          extra={
            <Button variant="primary" onPress={messagesRequest.refresh}>
              <RotateCw size={16} />
              {t('page.refresh')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!selectedMessageId) {
    const hasMessages = (messagesRequest.data?.messages.length ?? 0) > 0;
    return (
      <div className={styles.pageContainer}>
        <EmptyState
          title={hasMessages ? t('page.selectTitle') : t('page.emptyTitle')}
          description={hasMessages ? t('page.selectDescription') : t('page.emptyDescription')}
          className={styles.emptyState}
        />
      </div>
    );
  }

  if (!selectedMessage) {
    return (
      <div className={styles.pageContainer}>
        <ResultState
          status="404"
          title={t('page.notFoundTitle')}
          subTitle={t('page.notFoundDescription')}
        />
      </div>
    );
  }

  const messageTitle = selectedMessage.title || t('page.untitled');

  return (
    <div className={styles.pageContainer}>
      <article className={styles.messagePanel}>
        <h1 className={styles.messageTitle}>{messageTitle}</h1>
        <div className={styles.messageMeta}>
          <span>{resolveMessageTypeLabel(selectedMessage, t)}</span>
          <span>{formatTimestampToDateTime(selectedMessage.createTime)}</span>
          <span>
            {selectedMessage.read ? t('page.readStatus.read') : t('page.readStatus.unread')}
          </span>
        </div>
        <div className={styles.messageContent}>
          <Markdown content={selectedMessage.content} linkMode="safe" />
        </div>
        {selectedMessage.jumpUrl ? (
          <div className={styles.messageActions}>
            <Button variant="primary" onPress={handleOpenJumpUrl}>
              <ExternalLink size={16} />
              {t('page.jumpLink')}
            </Button>
          </div>
        ) : null}
      </article>
    </div>
  );
}

export default NotificationsPage;
