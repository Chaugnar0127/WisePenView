import type { ReactNode } from 'react';

import type { GuideToolId } from '@/constants/tour';

export interface GuideAnchorProps {
  /** 不传时只渲染子节点，不参与高亮。取值来自 GUIDE_TOOL_ID。 */
  id?: GuideToolId;
  /**
   * inline：包住按钮，壳的大小跟着按钮走。
   * area：横向铺满，高度跟着内容。
   * fill：占满父级留给这块区域的空间。
   * asChild 为 true 时不使用。
   */
  layout?: 'inline' | 'area' | 'fill';
  /** 把 id 写到唯一子组件上，测量的是那张卡片，不另加壳。用于会裁切内容的弹出层。 */
  asChild?: boolean;
  children: ReactNode;
}
