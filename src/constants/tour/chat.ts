import { GUIDE_ACTION_ID } from './actions';
import { step } from './step';
import { GUIDE_TOOL_ID } from './toolId';
import type { GuideTourConfig } from './types';

export const chatTour: GuideTourConfig = {
  steps: [
    step(
      'composer',
      GUIDE_TOOL_ID.chatComposer,
      'chat.composer.title',
      'chat.composer.content',
      'top',
      undefined,
      { offset: 0 }
    ),
    step('voice', GUIDE_TOOL_ID.chatVoice, 'chat.voice.title', 'chat.voice.content', 'top'),
    step(
      'model',
      GUIDE_TOOL_ID.chatModelOpen,
      'chat.model.title',
      'chat.model.content',
      'top',
      GUIDE_ACTION_ID.openModelMenu,
      {
        offset: 0,
        restore: GUIDE_ACTION_ID.openModelMenu,
        spotlightToolIds: [GUIDE_TOOL_ID.chatModel, GUIDE_TOOL_ID.chatModelOpen],
      }
    ),
    step(
      'upload',
      GUIDE_TOOL_ID.chatUploadOpen,
      'chat.upload.title',
      'chat.upload.content',
      'top',
      GUIDE_ACTION_ID.openUploadMenu,
      {
        restore: GUIDE_ACTION_ID.openUploadMenu,
        spotlightToolIds: [GUIDE_TOOL_ID.chatUpload, GUIDE_TOOL_ID.chatUploadOpen],
      }
    ),
    step(
      'agent',
      GUIDE_TOOL_ID.chatAgentOpen,
      'chat.agent.title',
      'chat.agent.content',
      'top',
      GUIDE_ACTION_ID.openAgentMenu,
      {
        restore: GUIDE_ACTION_ID.openAgentMenu,
        spotlightToolIds: [GUIDE_TOOL_ID.chatAgent, GUIDE_TOOL_ID.chatAgentOpen],
      }
    ),
    step(
      'skill',
      GUIDE_TOOL_ID.chatSkillOpen,
      'chat.skill.title',
      'chat.skill.content',
      'top',
      GUIDE_ACTION_ID.openSkillMenu,
      {
        restore: GUIDE_ACTION_ID.openSkillMenu,
        spotlightToolIds: [GUIDE_TOOL_ID.chatSkill, GUIDE_TOOL_ID.chatSkillOpen],
      }
    ),
  ],
};
