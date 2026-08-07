import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './style.module.less';

interface ResourceFrameProps {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

function ResourceFrame({ header, children, className, bodyClassName }: ResourceFrameProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {header}
      <div className={clsx(styles.body, bodyClassName)}>{children}</div>
    </div>
  );
}

export default ResourceFrame;
