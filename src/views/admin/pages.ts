import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';

export const ADMIN_PAGE_CONFIGS = {
  users: {
    path: APP_ROUTE_PATH.ADMIN_USERS,
    titleKey: 'page.users.title',
    subtitleKey: 'page.users.subtitle',
  },
  resources: {
    path: APP_ROUTE_PATH.ADMIN_RESOURCES,
    titleKey: 'page.resources.title',
    subtitleKey: 'page.resources.subtitle',
  },
  groups: {
    path: APP_ROUTE_PATH.ADMIN_GROUPS,
    titleKey: 'page.groups.title',
    subtitleKey: 'page.groups.subtitle',
  },
  announcements: {
    path: APP_ROUTE_PATH.ADMIN_ANNOUNCEMENTS,
    titleKey: 'page.announcements.title',
    subtitleKey: 'page.announcements.subtitle',
  },
  statistics: {
    path: APP_ROUTE_PATH.ADMIN_STATISTICS,
    titleKey: 'page.statistics.title',
    subtitleKey: 'page.statistics.subtitle',
  },
  permissions: {
    path: APP_ROUTE_PATH.ADMIN_PERMISSIONS,
    titleKey: 'page.permissions.title',
    subtitleKey: 'page.permissions.subtitle',
  },
  settings: {
    path: APP_ROUTE_PATH.ADMIN_SETTINGS,
    titleKey: 'page.settings.title',
    subtitleKey: 'page.settings.subtitle',
  },
  logs: {
    path: APP_ROUTE_PATH.ADMIN_LOGS,
    titleKey: 'page.logs.title',
    subtitleKey: 'page.logs.subtitle',
  },
  tasks: {
    path: APP_ROUTE_PATH.ADMIN_TASKS,
    titleKey: 'page.tasks.title',
    subtitleKey: 'page.tasks.subtitle',
  },
} as const;

export type AdminPageKey = keyof typeof ADMIN_PAGE_CONFIGS;
