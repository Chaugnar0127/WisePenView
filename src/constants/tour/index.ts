import { chatTour } from './chat';
import { courseResourcesTour } from './courseResources';
import { driveTour } from './drive';
import { noteTour } from './note';
import { sidebarTour } from './sidebar';
import type { GuideTourConfig, GuideTourId } from './types';

export const GUIDE_TOUR_ID = {
  sidebar: 'sidebar',
  chat: 'chat',
  note: 'note',
  drive: 'drive',
  courseResources: 'courseResources',
} as const satisfies Record<GuideTourId, GuideTourId>;

export const GUIDE_SHELL_TOUR_ID: GuideTourId = GUIDE_TOUR_ID.sidebar;

export const GUIDE_TOURS = {
  [GUIDE_TOUR_ID.sidebar]: sidebarTour,
  [GUIDE_TOUR_ID.chat]: chatTour,
  [GUIDE_TOUR_ID.note]: noteTour,
  [GUIDE_TOUR_ID.drive]: driveTour,
  [GUIDE_TOUR_ID.courseResources]: courseResourcesTour,
} satisfies Record<GuideTourId, GuideTourConfig>;

export { GUIDE_ACTION_ID, type GuideActionId } from './actions';
export { GUIDE_TOUR_CODE } from './task';
export { GUIDE_TOOL_ID, type GuideToolId } from './toolId';
export type {
  GuideSpotlightPadding,
  GuideStepConfig,
  GuideStepPlacement,
  GuideTourConfig,
  GuideTourId,
} from './types';
