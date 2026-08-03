import { LoadingState } from '@/components/Feedback';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

function ConversationLoading() {
  const { t } = useTranslation('chat');

  return (
    <div className={styles.wrapper} role="status" aria-live="polite" aria-busy="true">
      <LoadingState label={t('message.conversationLoading')} className={styles.loadingState} />
    </div>
  );
}

export default ConversationLoading;
