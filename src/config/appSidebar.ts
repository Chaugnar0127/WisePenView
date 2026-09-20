// 对齐AppSidebar顶部的导航栏，被router和sidebarHeader使用
export const APP_SIDEBAR_HEADER_NAV_KEY = {
  CHAT: 'chat',
  DRIVE: 'drive',
  PUBLIC: 'public',
  NOTIFICATIONS: 'notifications',
} as const;

export type AppSidebarHeaderNavKey =
  (typeof APP_SIDEBAR_HEADER_NAV_KEY)[keyof typeof APP_SIDEBAR_HEADER_NAV_KEY];
