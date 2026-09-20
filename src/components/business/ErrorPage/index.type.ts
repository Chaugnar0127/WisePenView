import type { ReactNode } from 'react';

export type { AppErrorInfo } from './errorInfo';

export interface ErrorPageProps {
  error: unknown;
  /** 主操作语义：传壳内错误边界的 reset 回调为就地重试，缺省为整页刷新 */
  onRetry?: () => void;
  /** 展示错误详情折叠面板（含复制），用于整页错误页 */
  showDetail?: boolean;
  /** 错误编号行附带当前 pathname */
  showPathname?: boolean;
  /** 整页错误页使用 lg，壳内 fallback 使用默认尺寸 */
  actionSize?: 'md' | 'lg';
}

export interface ErrorPageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showFooter?: boolean;
}

export interface ErrorPageActionsProps {
  children: ReactNode;
  className?: string;
}
