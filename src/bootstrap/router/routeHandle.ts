import type { AppSidebarHeaderNavKey } from '@/config/appSidebar';

// AppSidebarHeaderNavKey 是有含义的头部选项，handle可能为空
export interface AppSidebarRouteHandle {
  selectedHeaderNavKey: AppSidebarHeaderNavKey | null;
}

// AppRouteHandle类型供router使用
export interface AppRouteHandle {
  appSidebar?: AppSidebarRouteHandle;
}
