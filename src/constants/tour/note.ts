import { GUIDE_ACTION_ID } from './actions';
import { step } from './step';
import { GUIDE_TOOL_ID } from './toolId';
import type { GuideTourConfig } from './types';

export const noteTour: GuideTourConfig = {
  steps: [
    step('title', GUIDE_TOOL_ID.noteTitle, 'note.title.title', 'note.title.content', 'bottom'),
    step('info', GUIDE_TOOL_ID.noteInfo, 'note.info.title', 'note.info.content', 'bottom'),
    step('body', GUIDE_TOOL_ID.noteBody, 'note.body.title', 'note.body.content', 'top'),
    step('outline', GUIDE_TOOL_ID.noteOutline, 'note.outline.title', 'note.outline.content'),
    step(
      'outline-open',
      GUIDE_TOOL_ID.noteOutlineOpen,
      'note.outlineOpen.title',
      'note.outlineOpen.content',
      'right',
      GUIDE_ACTION_ID.openOutline,
      { restore: GUIDE_ACTION_ID.openOutline }
    ),
    step('more', GUIDE_TOOL_ID.noteMore, 'note.more.title', 'note.more.content', 'bottom'),
    step(
      'more-open',
      GUIDE_TOOL_ID.noteMoreOpen,
      'note.moreOpen.title',
      'note.moreOpen.content',
      'left',
      GUIDE_ACTION_ID.openResourceMenu,
      { restore: GUIDE_ACTION_ID.openResourceMenu }
    ),
    step('chat', GUIDE_TOOL_ID.noteChat, 'note.chat.title', 'note.chat.content', 'left'),
    step(
      'new-chat',
      GUIDE_TOOL_ID.noteNewChat,
      'note.newChat.title',
      'note.newChat.content',
      'bottom',
      GUIDE_ACTION_ID.openChat
    ),
    step(
      'history',
      GUIDE_TOOL_ID.noteHistory,
      'note.history.title',
      'note.history.content',
      'bottom',
      GUIDE_ACTION_ID.openChat
    ),
    step(
      'composer',
      GUIDE_TOOL_ID.chatComposer,
      'note.composer.title',
      'note.composer.content',
      'top',
      GUIDE_ACTION_ID.openChat,
      { offset: 0 }
    ),
  ],
};
