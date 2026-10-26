import type { ReactNode } from 'react';

import type { ResourceHeaderNavigation } from '@/layouts/Resource/_context/host';

import type { ResourceToolbarProps } from '../ResourceToolbar/index.type';

export interface ResourceLayoutHeaderProps extends ResourceHeaderNavigation {
  /** 资源工具栏配置；存在时替代 inlineTitle 与 extra。 */
  resourceToolbar?: ResourceToolbarProps;
  /** 工具条中间区：如 PDF 图标 + 文件名 */
  inlineTitle?: ReactNode;
  /** 右侧操作区（分享等） */
  extra?: ReactNode;
  /** 工具条右侧的页面级扩展动作。 */
  trailingActions?: ReactNode;
  /** 工具条下方整块区域，如笔记可编辑标题 */
  titleBlock?: ReactNode;
  className?: string;
}
