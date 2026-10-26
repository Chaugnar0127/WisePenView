import { PanelRightClose } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import AppIconButton from '@/components/base/Button/AppIconButton';

import styles from './ResourceInlineCommentPanel.module.scss';

function ResourceInlineCommentPanel({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const { t } = useTranslation('resource');

  return (
    <section className={styles.panel} aria-label={t('sidePanel.annotationAria')}>
      <header className={styles.header}>
        <AppIconButton
          icon={<PanelRightClose size={18} aria-hidden="true" />}
          label={t('sidePanel.collapseAnnotation')}
          onPress={onClose}
        />
        <h2 className={styles.title}>{t('sidePanel.annotation')}</h2>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

export default ResourceInlineCommentPanel;
