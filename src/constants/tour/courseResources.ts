import { GUIDE_ACTION_ID } from './actions';
import { step } from './step';
import { GUIDE_TOOL_ID } from './toolId';
import type { GuideTourConfig } from './types';

export const courseResourcesTour: GuideTourConfig = {
  steps: [
    step(
      'home',
      GUIDE_TOOL_ID.courseHomeTitle,
      'courseResources.home.title',
      'courseResources.home.content',
      'left',
      undefined,
      {
        offset: 80,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.courseHomePage],
      }
    ),
    step(
      'learning',
      GUIDE_TOOL_ID.courseEnterLearning,
      'courseResources.learning.title',
      'courseResources.learning.content',
      'right',
      GUIDE_ACTION_ID.openCourseHome
    ),
    step(
      'materials',
      GUIDE_TOOL_ID.courseMaterialsTitle,
      'courseResources.materials.title',
      'courseResources.materials.content',
      'left',
      GUIDE_ACTION_ID.openCourseMaterials,
      {
        offset: 80,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.courseMaterialsPage],
      }
    ),
    step(
      'members',
      GUIDE_TOOL_ID.courseMembersTitle,
      'courseResources.members.title',
      'courseResources.members.content',
      'left',
      GUIDE_ACTION_ID.openCourseMembers,
      {
        offset: 80,
        preventFlip: false,
        spotlightToolIds: [GUIDE_TOOL_ID.courseMembersPage],
      }
    ),
  ],
};
