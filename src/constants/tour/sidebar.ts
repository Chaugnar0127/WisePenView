import { GUIDE_ACTION_ID } from './actions';
import { step } from './step';
import { GUIDE_TOOL_ID } from './toolId';
import type { GuideTourConfig } from './types';

export const sidebarTour: GuideTourConfig = {
  steps: [
    step(
      'new-chat',
      GUIDE_TOOL_ID.sidebarNewChat,
      'sidebar.newChat.title',
      'sidebar.newChat.content'
    ),
    step(
      'new-note',
      GUIDE_TOOL_ID.sidebarNewNote,
      'sidebar.newNote.title',
      'sidebar.newNote.content'
    ),
    step('drive', GUIDE_TOOL_ID.sidebarDrive, 'sidebar.drive.title', 'sidebar.drive.content'),
    step('groups', GUIDE_TOOL_ID.sidebarGroups, 'sidebar.groups.title', 'sidebar.groups.content'),
    step(
      'notifications',
      GUIDE_TOOL_ID.sidebarNotifications,
      'sidebar.notifications.title',
      'sidebar.notifications.content'
    ),
    step(
      'library',
      GUIDE_TOOL_ID.sidebarLibrary,
      'sidebar.library.title',
      'sidebar.library.content'
    ),
    step(
      'collapse',
      GUIDE_TOOL_ID.sidebarCollapse,
      'sidebar.collapse.title',
      'sidebar.collapse.content',
      'bottom'
    ),
    step(
      'account',
      GUIDE_TOOL_ID.sidebarAccount,
      'sidebar.account.title',
      'sidebar.account.content'
    ),
    step(
      'account-open',
      GUIDE_TOOL_ID.sidebarAccountOpen,
      'sidebar.accountOpen.title',
      'sidebar.accountOpen.content',
      'right',
      GUIDE_ACTION_ID.openAccountMenu,
      { restore: GUIDE_ACTION_ID.openAccountMenu }
    ),
  ],
};
