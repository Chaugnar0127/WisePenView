'use client';

import AppIconButton from '@/components/Button/AppIconButton';
import { cn } from '@/utils/cn';
import * as React from 'react';
import styles from './attachment.module.less';

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';
type AttachmentSize = 'default' | 'sm' | 'xs';
type AttachmentOrientation = 'horizontal' | 'vertical';
type AttachmentMediaVariant = 'icon' | 'image';

interface AttachmentProps extends React.ComponentProps<'div'> {
  state?: AttachmentState;
  size?: AttachmentSize;
  orientation?: AttachmentOrientation;
}

interface AttachmentMediaProps extends React.ComponentProps<'div'> {
  variant?: AttachmentMediaVariant;
}

interface AttachmentTriggerProps extends React.ComponentProps<'button'> {
  asChild?: boolean;
}

const attachmentSizeClassName: Record<AttachmentSize, string> = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  xs: styles.sizeXs,
};

const attachmentOrientationClassName: Record<AttachmentOrientation, string> = {
  horizontal: styles.horizontal,
  vertical: styles.vertical,
};

function Attachment({
  className,
  state = 'done',
  size = 'default',
  orientation = 'horizontal',
  ...props
}: AttachmentProps) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={cn(
        styles.attachment,
        attachmentSizeClassName[size],
        attachmentOrientationClassName[orientation],
        className
      )}
      {...props}
    />
  );
}

function AttachmentMedia({ className, variant = 'icon', ...props }: AttachmentMediaProps) {
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(styles.media, variant === 'image' && styles.mediaImage, className)}
      {...props}
    />
  );
}

function AttachmentContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="attachment-content" className={cn(styles.content, className)} {...props} />
  );
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="attachment-title" className={cn(styles.title, className)} {...props} />;
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="attachment-description"
      className={cn(styles.description, className)}
      {...props}
    />
  );
}

function AttachmentActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="attachment-actions" className={cn(styles.actions, className)} {...props} />
  );
}

function AttachmentAction({
  children,
  className,
  size = 'sm',
  ...props
}: Omit<React.ComponentProps<typeof AppIconButton>, 'icon'> & { children: React.ReactNode }) {
  return (
    <AppIconButton
      icon={children}
      data-slot="attachment-action"
      size={size}
      className={cn(styles.action, className)}
      {...props}
    />
  );
}

function AttachmentTrigger({ asChild = false, className, type, ...props }: AttachmentTriggerProps) {
  if (asChild) {
    return <AttachmentTriggerSlot className={cn(styles.trigger, className)} {...props} />;
  }

  return (
    <button
      data-slot="attachment-trigger"
      type={type ?? 'button'}
      className={cn(styles.trigger, className)}
      {...props}
    />
  );
}

function AttachmentTriggerSlot({
  children,
  className,
  ...props
}: Omit<AttachmentTriggerProps, 'asChild'>) {
  if (!React.isValidElement<Record<string, unknown>>(children)) {
    return null;
  }

  const childClassName =
    typeof children.props.className === 'string' ? children.props.className : undefined;

  return React.cloneElement(children, {
    ...props,
    'data-slot': 'attachment-trigger',
    className: cn(styles.trigger, className, childClassName),
  });
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-group" className={cn(styles.group, className)} {...props} />;
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
