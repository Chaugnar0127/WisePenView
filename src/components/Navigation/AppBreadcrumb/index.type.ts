import type { ReactNode } from 'react';
import type { To } from 'react-router-dom';

export interface AppBreadcrumbItem {
  key: string;
  label: ReactNode;
  to?: To;
  current?: boolean;
}

export interface AppBreadcrumbProps {
  items: AppBreadcrumbItem[];
  ariaLabel: string;
  className?: string;
  /** 包装单个路径项内容，用于拖放等业务扩展。 */
  renderItem?: (content: ReactNode, item: AppBreadcrumbItem, isCurrent: boolean) => ReactNode;
}
