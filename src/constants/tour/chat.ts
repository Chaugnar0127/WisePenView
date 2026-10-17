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
    step('upload', GUIDE_TOOL_ID.chatUpload, 'chat.upload.title', 'chat.upload.content', 'top'),
    step(
      'upload-open',
      GUIDE_TOOL_ID.chatUploadOpen,
      'chat.uploadOpen.title',
      'chat.uploadOpen.content',
      'top',
      GUIDE_ACTION_ID.openUploadMenu,
      { restore: GUIDE_ACTION_ID.openUploadMenu }
    ),
    step('agent', GUIDE_TOOL_ID.chatAgent, 'chat.agent.title', 'chat.agent.content', 'top'),
    step(
      'agent-open',
      GUIDE_TOOL_ID.chatAgentOpen,
      'chat.agentOpen.title',
      'chat.agentOpen.content',
      'top',
      GUIDE_ACTION_ID.openAgentMenu,
      { restore: GUIDE_ACTION_ID.openAgentMenu }
    ),
    step('skill', GUIDE_TOOL_ID.chatSkill, 'chat.skill.title', 'chat.skill.content', 'top'),
    step(
      'skill-open',
      GUIDE_TOOL_ID.chatSkillOpen,
      'chat.skillOpen.title',
      'chat.skillOpen.content',
      'top',
      GUIDE_ACTION_ID.openSkillMenu,
      { restore: GUIDE_ACTION_ID.openSkillMenu }
    ),
    step('model', GUIDE_TOOL_ID.chatModel, 'chat.model.title', 'chat.model.content', 'top'),
    step(
      'model-open',
      GUIDE_TOOL_ID.chatModelOpen,
      'chat.modelOpen.title',
      'chat.modelOpen.content',
      'top',
      GUIDE_ACTION_ID.openModelMenu,
      { offset: 0, restore: GUIDE_ACTION_ID.openModelMenu }
    ),
    step('voice', GUIDE_TOOL_ID.chatVoice, 'chat.voice.title', 'chat.voice.content', 'top'),
    step('send', GUIDE_TOOL_ID.chatSend, 'chat.send.title', 'chat.send.content', 'top'),
  ],
};
