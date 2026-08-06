import { EmptyState, ResultState, Spin } from '@/components/Feedback';
import { useMessageService } from '@/domains';
import type { UserMessage } from '@/domains/Message';
import { parseErrorMessage } from '@/utils/error';
import { formatRelativeTimestamp, formatTimestampToDateTime } from '@/utils/format/formatTime';
import { extractMarkdownPlainText } from '@/utils/markdown/extractMarkdownPlainText';
import { buildNotificationPath } from '@/utils/navigation/appRoute';
import { Button, Heading, Paragraph, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import clsx from 'clsx';
import { CheckCheck, ChevronDown, ChevronUp, ExternalLink, RotateCw } from 'lucide-react';
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
  const { t, i18n } = useTranslation('message');
  const messageService = useMessageService();
  const navigate = useNavigate();
  const { messageId: routeMessageId } = useParams<{ messageId: string }>();
  const selectedMessageId = routeMessageId ? decodeURIComponent(routeMessageId) : undefined;
  const locale = i18n.resolvedLanguage === 'en-US' ? 'en-US' : 'zh-CN';

  const messagesRequest = useRequest(() =>
    messageService.listUserMessages({ page: 1, size: MESSAGE_PAGE_SIZE })
  );

  const selectedMessage = messagesRequest.data?.messages.find(
    (message) => message.messageId === selectedMessageId
  );
  const isInitialLoading = messagesRequest.loading && messagesRequest.data == null;

  const { runAsync: readMessage } = useRequest(
    (messageId: string) => messageService.readMessage({ messageId }),
    { manual: true }
  );

  const handleSelectMessage = async (message: UserMessage) => {
    navigate(buildNotificationPath(message.messageId));
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
      navigate(buildNotificationPath());
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

  const messages = messagesRequest.data?.messages ?? [];
  const hasUnreadMessages = messages.some((message) => !message.read);

  return (
    <div className={styles.pageContainer}>
      <section className={styles.notificationCenter} aria-labelledby="notifications-title">
        <div className={styles.pageHeader}>
          <div>
            <Heading level={1} id="notifications-title" className={styles.pageTitle}>
              {t('page.title')}
            </Heading>
            <Paragraph size="sm" color="muted" className={styles.pageSubtitle}>
              {t('page.subtitle')}
            </Paragraph>
          </div>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={!hasUnreadMessages}
            onPress={handleMarkAllAsRead}
          >
            <CheckCheck size={16} />
            {t('page.markAllAsRead')}
          </Button>
        </div>

        <div className={styles.pageBody}>
          {messagesRequest.error ? (
            <div className={styles.pageState}>
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
          ) : isInitialLoading ? (
            <div className={styles.pageState} role="status" aria-live="polite" aria-busy="true">
              <Spin size="large" tip={t('page.loading')} />
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.pageState}>
              <EmptyState
                title={t('page.emptyTitle')}
                description={t('page.emptyDescription')}
                className={styles.emptyState}
              />
            </div>
          ) : selectedMessageId && !selectedMessage ? (
            <div className={styles.pageState}>
              <ResultState
                status="404"
                title={t('page.notFoundTitle')}
                subTitle={t('page.notFoundDescription')}
              />
            </div>
          ) : (
            <div className={styles.messageList}>
              {messages.map((message) => {
                const isSelected = message.messageId === selectedMessageId;
                const isUnread = !message.read;
                const title = message.title || t('page.untitled');
                const preview = extractMarkdownPlainText(message.content);
                const content = extractMarkdownPlainText(message.content, {
                  preserveLineBreaks: true,
                });
                const absoluteTime = formatTimestampToDateTime(message.createTime);
                const absoluteTimeShort = absoluteTime.replace(/:\d{2}$/, '');
                const relativeTime =
                  formatRelativeTimestamp(message.createTime, locale) || absoluteTimeShort;
                const typeLabel = resolveMessageTypeLabel(message, t);
                const createTimeIso = message.createTime
                  ? new Date(message.createTime).toISOString()
                  : undefined;

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
                        onClick={() => void handleToggleMessage(message)}
                      >
                        <span className={styles.messageStatusLine}>
                          <span
                            className={clsx(styles.statusDot, !isUnread && styles.statusDotRead)}
                            aria-hidden="true"
                          />
                          <span>{typeLabel}</span>
                          {!isUnread ? (
                            <span className={styles.readLabel}>{t('page.readStatus.read')}</span>
                          ) : null}
                        </span>
                        <strong className={styles.messageTitle}>{title}</strong>
                        {!isSelected && preview ? (
                          <span className={styles.messagePreview}>{preview}</span>
                        ) : null}
                      </button>

                      <div className={styles.messageAside}>
                        <time
                          className={styles.sentAt}
                          dateTime={createTimeIso}
                          title={absoluteTime || undefined}
                        >
                          {relativeTime}
                        </time>
                        <button
                          type="button"
                          className={styles.toggleDetail}
                          aria-expanded={isSelected}
                          aria-label={isSelected ? t('page.hideMessage') : t('page.showMessage')}
                          onClick={() => void handleToggleMessage(message)}
                        >
                          {isSelected ? (
                            <ChevronUp size={16} aria-hidden />
                          ) : (
                            <ChevronDown size={16} aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className={styles.messageBody}>
                        {absoluteTimeShort ? (
                          <time
                            className={styles.absoluteSentAt}
                            dateTime={createTimeIso}
                            title={absoluteTime || undefined}
                          >
                            {absoluteTimeShort}
                          </time>
                        ) : null}
                        <p className={styles.messageContent}>{content}</p>
                        {message.jumpUrl ? (
                          <div className={styles.messageActions}>
                            <Button
                              size="sm"
                              variant="secondary"
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
          )}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
