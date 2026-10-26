import { createContext, type ReactNode } from 'react';

import type { AppBreadcrumbItem } from '@/components/base/AppBreadcrumb';
import type { DriveNodeScope, DriveResourceLocation } from '@/domains/Drive';
import type { ResourceViewer } from '@/domains/Resource/model/resourceTarget';

export interface OpenResourceTarget {
  resourceId: string;
  resourceType?: string;
  resourceName?: string;
  viewer?: string;
  driveLocation?: DriveResourceLocation;
  replace?: boolean;
}

export interface OpenResourceFn {
  (target: OpenResourceTarget): void;
}

export interface ResourceHostRouteContext {
  resourceId?: string;
  resourceType?: string;
  viewer?: string;
  driveLocation?: DriveResourceLocation;
}

export interface ResourceHostDriveNavigationTarget {
  scope: DriveNodeScope;
  nodeId?: string;
}

export interface ResourceHostViewerNavigationTarget {
  resourceId: string;
  viewer: ResourceViewer;
}

export interface ResourceHostContextValue {
  hostId: string;
  routeContext: ResourceHostRouteContext;
  openResource: OpenResourceFn;
  navigateToDrive: (target: ResourceHostDriveNavigationTarget) => void;
  switchResourceViewer: (target: ResourceHostViewerNavigationTarget) => void;
  navigateResourceHash?: (hash: string) => void;
  /** 左侧栏是否折叠，用于资源顶栏适配桌面窗口控件。 */
  leftSidebarCollapsed?: boolean;
  fallbackHeader?: ReactNode;
  breadcrumbItems?: AppBreadcrumbItem[];
}

export const ResourceHostContext = createContext<ResourceHostContextValue | null>(null);

export const DEFAULT_RESOURCE_HOST_ID = 'default';
