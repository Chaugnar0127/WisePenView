import { GUIDE_ACTION_ID } from './actions';
import { step } from './step';
import { GUIDE_TOOL_ID } from './toolId';
import type { GuideTourConfig } from './types';

export const driveTour: GuideTourConfig = {
  steps: [
    step('views', GUIDE_TOOL_ID.driveViews, 'drive.views.title', 'drive.views.content', 'bottom'),
    step('path', GUIDE_TOOL_ID.drivePath, 'drive.path.title', 'drive.path.content', 'bottom'),
    step(
      'create',
      GUIDE_TOOL_ID.driveCreate,
      'drive.create.title',
      'drive.create.content',
      'bottom'
    ),
    step(
      'create-open',
      GUIDE_TOOL_ID.driveCreateOpen,
      'drive.createOpen.title',
      'drive.createOpen.content',
      'bottom',
      GUIDE_ACTION_ID.openCreateMenu,
      { restore: GUIDE_ACTION_ID.openCreateMenu }
    ),
    step('files', GUIDE_TOOL_ID.driveFiles, 'drive.files.title', 'drive.files.content', 'top'),
    step(
      'details',
      GUIDE_TOOL_ID.driveDetails,
      'drive.details.title',
      'drive.details.content',
      'left'
    ),
    step(
      'details-open',
      GUIDE_TOOL_ID.driveDetailsOpen,
      'drive.detailsOpen.title',
      'drive.detailsOpen.content',
      'left',
      GUIDE_ACTION_ID.openDetails,
      { restore: GUIDE_ACTION_ID.openDetails }
    ),
  ],
};
