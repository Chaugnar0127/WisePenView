import { useEffect } from 'react';

import { registerPageTour } from '../pageTourRegistry';
import type { GuideScopeProps } from './index.type';

/** 页面出口上的薄层：按 tourId 登记当前页的指引，不渲染 Joyride。 */
export function GuideScope({ tourId, children }: GuideScopeProps) {
  /**
   * @wisepen-manual-effect
   * 执行时机：页面挂载或 tourId 变化时登记指引，卸载时撤销。
   * 不可替代原因：页面通过组件树声明自己参加哪条指引，步骤表不放进页面目录。
   * cleanup：撤销登记，避免离开页面后继续播放该页指引。
   */
  useEffect(() => {
    if (!tourId) return undefined;
    return registerPageTour(tourId);
  }, [tourId]);

  return children;
}
