import { cn } from '@/utils/cn';
import { Heading, Paragraph } from '@heroui/react';
import type { ReactNode } from 'react';
import styles from './style.module.less';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  className?: string;
  contentClassName?: string;
  actionsClassName?: string;
}

function PageHeader({
  title,
  subtitle,
  actions,
  titleId,
  className,
  contentClassName,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <div className={cn(styles.pageHeader, className)}>
      <div className={cn(styles.content, contentClassName)}>
        <Heading level={1} id={titleId} className={styles.title}>
          {title}
        </Heading>
        {subtitle ? (
          <Paragraph size="sm" color="muted" className={styles.subtitle}>
            {subtitle}
          </Paragraph>
        ) : null}
      </div>
      {actions ? <div className={cn(styles.actions, actionsClassName)}>{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
