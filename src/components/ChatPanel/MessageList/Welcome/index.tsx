import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

function Welcome() {
  const { t } = useTranslation('chat');
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('message.welcome.title')}</h1>
    </div>
  );
}

export default Welcome;
