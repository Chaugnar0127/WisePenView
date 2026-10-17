import type { GuideTourId } from '@/constants/tour';

import type { GuideActionPort } from '../guideActions';

export interface GuideHostProps {
  shellTourId?: GuideTourId;
  actions: GuideActionPort;
}
