import type { ComponentProps } from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

import clsx from 'clsx';
import styles from './style.module.less';

function SystemResizablePanelGroup({
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.Group>) {
  return (
    <ResizablePrimitive.Group
      data-slot="system-resizable-panel-group"
      className={clsx(styles.panelGroup, className)}
      {...props}
    />
  );
}

function SystemResizablePanel({
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.Panel>) {
  return (
    <ResizablePrimitive.Panel data-slot="system-resizable-panel" className={className} {...props} />
  );
}

function SystemResizableHandle({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="system-resizable-handle"
      className={clsx(styles.handle, withHandle && styles.handleWithGrip, className)}
      {...props}
    >
      {withHandle ? <span className={styles.handleGrip} aria-hidden="true" /> : null}
    </ResizablePrimitive.Separator>
  );
}

export { SystemResizableHandle, SystemResizablePanel, SystemResizablePanelGroup };
