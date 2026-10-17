import type { Placement } from 'react-joyride';

import type { GuideActionId } from './actions';
import type { GuideToolId } from './toolId';

export type GuideStepPlacement = Placement | 'center' | 'auto';

/** 一条可配置的新手指引步骤。文案使用 tour namespace 下的 i18n key。 */
export interface GuideStepConfig {
  id: string;
  toolId: GuideToolId;
  titleKey: string;
  contentKey: string;
  placement?: GuideStepPlacement;
  /** 展示前由宿主改界面状态，例如展开对话。 */
  prepare?: GuideActionId;
  /** 离开这一步时收回 prepare 打开的界面。 */
  restore?: GuideActionId;
  /** 优先用给定方位。这一侧会伸出窗口时改到对面。 */
  preventFlip?: boolean;
  /** 气泡与目标的间距。紧贴输入框时用 0。 */
  offset?: number;
}

export interface GuideTourConfig {
  steps: readonly GuideStepConfig[];
}

export type GuideTourId = 'sidebar' | 'chat' | 'note' | 'drive';
