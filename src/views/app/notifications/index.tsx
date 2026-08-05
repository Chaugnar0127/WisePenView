import { EmptyState, LoadingState, ResultState } from '@/components/Feedback';
import { useMessageService } from '@/domains';
import type { UserMessage } from '@/domains/Message';
import { parseErrorMessage } from '@/utils/error';
import { formatTimestampToDateTime } from '@/utils/format/formatTime';
import { extractMarkdownPlainText } from '@/utils/markdown/extractMarkdownPlainText';
import { Button, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import clsx from 'clsx';
import { CheckCheck, ExternalLink, RotateCw } from 'lucide-react';
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

  const { runAsync: readMessage } = useRequest(
    (messageId: string) => messageService.readMessage({ messageId }),
    { manual: true }
  );

  const handleSelectMessage = async (message: UserMessage) => {
    navigate(`/app/notifications/${encodeURIComponent(message.messageId)}`);
    if (message.read) return;
    try {
      await readMessage(message.messageId);
      messagesRequest.refresh();
    } catch (error: unknown) {
      toast.warning(parseErrorMessage(error));
    }
  };

  const handleToggleMessage = async (message: UserMessage) => {
    if (message.messageId === selectedMessageId) {
      navigate('/app/notifications');
      return;
    }
    await handleSelectMessage(message);
  };

  const handleMarkAllAsRead = async () => {
    const unreadMessages = messagesRequest.data?.messages.filter((message) => !message.read) ?? [];
    if (unreadMessages.length === 0) return;
    try {
      await Promise.all(unreadMessages.map((message) => readMessage(message.messageId)));
      messagesRequest.refresh();
    } catch (error: unknown) {
      toast.warning(parseErrorMessage(error));
    }
  };

  const handleOpenJumpUrl = (message: UserMessage) => {
    if (!message.jumpUrl) return;
    if (/^https?:\/\//i.test(message.jumpUrl)) {
      window.open(message.jumpUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(message.jumpUrl);
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

  const messages = messagesRequest.data?.messages ?? [];
  const hasUnreadMessages = messages.some((message) => !message.read);

  if (messages.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <EmptyState
          title={t('page.emptyTitle')}
          description={t('page.emptyDescription')}
          className={styles.emptyState}
        />
      </div>
    );
  }

  if (selectedMessageId && !selectedMessage) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.notificationCenter}>
          <ResultState
            status="404"
            title={t('page.notFoundTitle')}
            subTitle={t('page.notFoundDescription')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <section className={styles.notificationCenter} aria-labelledby="notifications-title">
        <div className={styles.pageHeader}>
          <div>
            <h1 id="notifications-title" className={styles.pageTitle}>
              {t('page.title')}
            </h1>
            <p className={styles.pageSubtitle}>{t('page.subtitle')}</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            isDisabled={!hasUnreadMessages}
            onPress={handleMarkAllAsRead}
          >
            <CheckCheck size={16} />
            {t('page.markAllAsRead')}
          </Button>
        </div>

        <div className={styles.messageList}>
          {messages.map((message) => {
            const isSelected = message.messageId === selectedMessageId;
            const title = message.title || t('page.untitled');
            const preview = extractMarkdownPlainText(message.content);
            const content = extractMarkdownPlainText(message.content, { preserveLineBreaks: true });

            return (
              <article
                key={message.messageId}
                className={clsx(styles.messageItem, isSelected && styles.messageItemSelected)}
              >
                <div className={styles.messageSummary}>
                  <button
                    type="button"
                    className={styles.messageOpenButton}
                    aria-expanded={isSelected}
                    onClick={() => void handleSelectMessage(message)}
                  >
                    <span className={styles.messageInfo}>
                      <span className={styles.messageStatusLine}>
                        <span
                          className={clsx(styles.statusDot, message.read && styles.statusDotRead)}
                          aria-hidden="true"
                        />
                        <span>{resolveMessageTypeLabel(message, t)}</span>
                        {message.read ? <span>{t('page.readStatus.read')}</span> : null}
                      </span>
                      <strong className={styles.messageTitle}>{title}</strong>
                      {!isSelected ? (
                        <span className={styles.messagePreview}>{preview}</span>
                      ) : null}
                    </span>
                  </button>
                  <span className={styles.messageSide}>
                    <time
                      className={styles.sentAt}
                      dateTime={
                        message.createTime ? new Date(message.createTime).toISOString() : undefined
                      }
                    >
                      {formatTimestampToDateTime(message.createTime)}
                    </time>
                    <button
                      type="button"
                      className={styles.toggleDetail}
                      onClick={() => void handleToggleMessage(message)}
                    >
                      {isSelected ? t('page.hideMessage') : t('page.showMessage')}
                    </button>
                  </span>
                </div>

                {isSelected ? (
                  <div className={styles.messageBody}>
                    <p className={styles.messageContent}>{content}</p>
                    {message.jumpUrl ? (
                      <div className={styles.messageActions}>
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() => handleOpenJumpUrl(message)}
                        >
                          <ExternalLink size={16} />
                          {t('page.jumpLink')}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
