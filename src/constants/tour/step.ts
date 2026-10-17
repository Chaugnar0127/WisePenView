import type { GuideActionId } from './actions';
import type { GuideToolId } from './toolId';
import type { GuideStepConfig } from './types';

interface GuideStepOptions {
  restore?: GuideActionId;
  offset?: number;
}

export function step(
  id: string,
  toolId: GuideToolId,
  titleKey: string,
  contentKey: string,
  placement: GuideStepConfig['placement'] = 'right',
  prepare?: GuideActionId,
  options: GuideStepOptions = {}
): GuideStepConfig {
  return {
    id,
    toolId,
    titleKey,
    contentKey,
    placement,
    preventFlip: true,
    ...(prepare ? { prepare } : {}),
    ...options,
  };
}
