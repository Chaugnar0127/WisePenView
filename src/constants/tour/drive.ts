import { GUIDE_ACTION_ID } from './actions';
import { step } from './step';
import { GUIDE_TOOL_ID } from './toolId';
import type { GuideTourConfig } from './types';

export const driveTour: GuideTourConfig = {
  steps: [
    step(
      'files',
      GUIDE_TOOL_ID.driveTabFiles,
      'drive.files.title',
      'drive.files.content',
      'left',
      GUIDE_ACTION_ID.showDriveFiles,
      {
        offset: 16,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.driveTabFiles, GUIDE_TOOL_ID.driveViewContent],
        tooltipWidth: '20rem',
      }
    ),
    step(
      'upload-queue',
      GUIDE_TOOL_ID.driveTabUploadQueue,
      'drive.uploadQueue.title',
      'drive.uploadQueue.content',
      'left',
      GUIDE_ACTION_ID.showDriveUploadQueue,
      {
        offset: 16,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.driveTabUploadQueue, GUIDE_TOOL_ID.driveViewContent],
        tooltipWidth: '20rem',
      }
    ),
    step(
      'favorites',
      GUIDE_TOOL_ID.driveTabFavorites,
      'drive.favorites.title',
      'drive.favorites.content',
      'left',
      GUIDE_ACTION_ID.showDriveFavorites,
      {
        offset: 16,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.driveTabFavorites, GUIDE_TOOL_ID.driveViewContent],
        tooltipWidth: '20rem',
      }
    ),
    step(
      'trash',
      GUIDE_TOOL_ID.driveTabTrash,
      'drive.trash.title',
      'drive.trash.content',
      'left',
      GUIDE_ACTION_ID.showDriveTrash,
      {
        offset: 16,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.driveTabTrash, GUIDE_TOOL_ID.driveViewContent],
        tooltipWidth: '20rem',
      }
    ),
  ],
};
