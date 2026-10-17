import { chatTour } from './chat';
import { driveTour } from './drive';
import { noteTour } from './note';
import { sidebarTour } from './sidebar';
import type { GuideTourConfig, GuideTourId } from './types';

/** 后端记下「已看过」之前先不自动播放。接上后改为 true。 */
export const GUIDE_ENABLED = false;

export const GUIDE_TOUR_ID = {
  sidebar: 'sidebar',
  chat: 'chat',
  note: 'note',
  drive: 'drive',
} as const satisfies Record<GuideTourId, GuideTourId>;

export const GUIDE_SHELL_TOUR_ID: GuideTourId = GUIDE_TOUR_ID.sidebar;

export const GUIDE_TOURS = {
  [GUIDE_TOUR_ID.sidebar]: sidebarTour,
  [GUIDE_TOUR_ID.chat]: chatTour,
  [GUIDE_TOUR_ID.note]: noteTour,
  [GUIDE_TOUR_ID.drive]: driveTour,
} satisfies Record<GuideTourId, GuideTourConfig>;

export { GUIDE_ACTION_ID, type GuideActionId } from './actions';
export { GUIDE_TOOL_ID, type GuideToolId } from './toolId';
export type { GuideStepConfig, GuideStepPlacement, GuideTourConfig, GuideTourId } from './types';
