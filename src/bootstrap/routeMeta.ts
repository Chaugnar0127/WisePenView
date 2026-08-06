export const APP_HEADER_NAV_KEY = {
  CHAT: 'chat',
  DRIVE: 'drive',
  PUBLIC: 'public',
  NOTIFICATIONS: 'notifications',
} as const;

export type AppHeaderNavKey = (typeof APP_HEADER_NAV_KEY)[keyof typeof APP_HEADER_NAV_KEY];

export interface AppRouteMeta {
  pageKey: string;
  headerNav?: AppHeaderNavKey;
}

export interface AppRouteHandle {
  app: AppRouteMeta;
}

export const appRouteHandle = (app: AppRouteMeta): AppRouteHandle => ({ app });
