import type { ReactNode } from 'react';

import type { GuideTourId } from '@/constants/tour';

export interface GuideScopeProps {
  tourId?: GuideTourId;
  children: ReactNode;
}
