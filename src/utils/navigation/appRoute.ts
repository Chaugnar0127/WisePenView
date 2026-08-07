export const APP_ROUTE_PATH = {
  HOME: '/',
  AUTH: '/auth',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_ONBOARDING_BIND: '/auth/onboarding/bind',
  AUTH_PASSWORD_FORGOT: '/auth/password/forgot',
  AUTH_PASSWORD_RESET: '/auth/password/reset',
  AUTH_EMAIL_VERIFY: '/auth/email/verify',
  PUBLIC_CHAT: '/chat',
  APP: '/app',
  CHAT: '/app/chat',
  NOTIFICATIONS: '/app/notifications',
  DRIVE: '/app/drive',
  DRIVE_PERSONAL: '/app/drive/personal',
  DRIVE_UPLOAD_QUEUE: '/app/drive/upload-queue',
  DRIVE_FAVORITES: '/app/drive/favorites',
  DRIVE_TRASH: '/app/drive/trash',
  GROUPS: '/app/groups',
  COURSES: '/app/courses',
  INVITE: '/app/invite',
  RESOURCES: '/app/resources',
  PROFILE: '/app/profile',
  PROFILE_ACCOUNT: '/app/profile/account',
  PROFILE_USAGE: '/app/profile/usage',
  PROFILE_APPEARANCE: '/app/profile/appearance',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_RESOURCES: '/admin/resources',
  ADMIN_GROUPS: '/admin/groups',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_LOGS: '/admin/logs',
  ADMIN_TASKS: '/admin/tasks',
} as const;

export type GroupListRole = 'all' | 'joined' | 'managed';

export interface GroupListRouteQuery {
  role: GroupListRole;
  page: number;
  size: number;
}

export interface CourseListRouteQuery {
  page: number;
  size: number;
}

export const LIST_ROUTE_DEFAULTS = {
  page: 1,
  size: 8,
} as const;

const GROUP_LIST_ROLES: readonly GroupListRole[] = ['all', 'joined', 'managed'];

const encodePathSegment = (value: string): string => encodeURIComponent(value.trim());

const parsePositiveInteger = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizePositiveInteger = (value: number | undefined, fallback: number): number =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;

const appendListPagination = (
  search: URLSearchParams,
  query: Pick<CourseListRouteQuery, 'page' | 'size'>
): void => {
  if (query.page !== LIST_ROUTE_DEFAULTS.page) search.set('page', String(query.page));
  if (query.size !== LIST_ROUTE_DEFAULTS.size) search.set('size', String(query.size));
};

const appendSearch = (path: string, search: URLSearchParams): string => {
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export const parseGroupListRouteQuery = (search: URLSearchParams): GroupListRouteQuery => {
  const rawRole = search.get('role');
  const role = GROUP_LIST_ROLES.includes(rawRole as GroupListRole)
    ? (rawRole as GroupListRole)
    : 'all';
  return {
    role,
    page: parsePositiveInteger(search.get('page'), LIST_ROUTE_DEFAULTS.page),
    size: parsePositiveInteger(search.get('size'), LIST_ROUTE_DEFAULTS.size),
  };
};

export const parseCourseListRouteQuery = (search: URLSearchParams): CourseListRouteQuery => ({
  page: parsePositiveInteger(search.get('page'), LIST_ROUTE_DEFAULTS.page),
  size: parsePositiveInteger(search.get('size'), LIST_ROUTE_DEFAULTS.size),
});

export const buildGroupListPath = (query?: Partial<GroupListRouteQuery>): string => {
  const requestedRole = query?.role;
  const normalized: GroupListRouteQuery = {
    role: requestedRole && GROUP_LIST_ROLES.includes(requestedRole) ? requestedRole : 'all',
    page: normalizePositiveInteger(query?.page, LIST_ROUTE_DEFAULTS.page),
    size: normalizePositiveInteger(query?.size, LIST_ROUTE_DEFAULTS.size),
  };
  const search = new URLSearchParams();
  if (normalized.role !== 'all') search.set('role', normalized.role);
  appendListPagination(search, normalized);
  return appendSearch(APP_ROUTE_PATH.GROUPS, search);
};

export const buildInvitePath = (inviteCode?: string): string => {
  const search = new URLSearchParams();
  const normalizedInviteCode = inviteCode?.trim();
  if (normalizedInviteCode) search.set('code', normalizedInviteCode);
  return appendSearch(APP_ROUTE_PATH.INVITE, search);
};

export const buildCourseListPath = (query?: Partial<CourseListRouteQuery>): string => {
  const normalized: CourseListRouteQuery = {
    page: normalizePositiveInteger(query?.page, LIST_ROUTE_DEFAULTS.page),
    size: normalizePositiveInteger(query?.size, LIST_ROUTE_DEFAULTS.size),
  };
  const search = new URLSearchParams();
  appendListPagination(search, normalized);
  return appendSearch(APP_ROUTE_PATH.COURSES, search);
};

export const buildChatPath = (sessionId?: string): string =>
  sessionId?.trim()
    ? `${APP_ROUTE_PATH.CHAT}/${encodePathSegment(sessionId)}`
    : APP_ROUTE_PATH.CHAT;

export const buildNotificationPath = (messageId?: string): string =>
  messageId?.trim()
    ? `${APP_ROUTE_PATH.NOTIFICATIONS}/${encodePathSegment(messageId)}`
    : APP_ROUTE_PATH.NOTIFICATIONS;

export type GroupRoutePage = 'files' | 'members' | 'wallet' | 'token-transfer' | 'settings';

export const buildGroupPath = (groupId: string, page: GroupRoutePage): string =>
  `${APP_ROUTE_PATH.GROUPS}/${encodePathSegment(groupId)}/${page}`;

export const buildGroupFilesPath = (groupId: string, folderId?: string): string => {
  const basePath = buildGroupPath(groupId, 'files');
  return folderId?.trim() ? `${basePath}/folder/${encodePathSegment(folderId)}` : basePath;
};

export type CourseRoutePage =
  | 'home'
  | 'info'
  | 'assignments'
  | 'materials'
  | 'announcements'
  | 'members'
  | 'learning'
  | 'settings';

export const buildCoursePath = (courseId: string, page: CourseRoutePage): string =>
  `${APP_ROUTE_PATH.COURSES}/${encodePathSegment(courseId)}/${page}`;

export const buildCourseAssignmentPath = (courseId: string, assignmentId?: string): string => {
  const basePath = buildCoursePath(courseId, 'assignments');
  return assignmentId?.trim() ? `${basePath}/${encodePathSegment(assignmentId)}` : basePath;
};

export const buildCourseLearningPath = (courseId: string, outlineNodeId?: string): string => {
  const basePath = buildCoursePath(courseId, 'learning');
  return outlineNodeId?.trim() ? `${basePath}/${encodePathSegment(outlineNodeId)}` : basePath;
};

export const buildResourcePath = ({
  resourceType,
  resourceId,
  viewer,
}: {
  resourceType: string;
  resourceId: string;
  viewer?: string;
}): string => {
  const basePath = `${APP_ROUTE_PATH.RESOURCES}/${encodePathSegment(resourceType)}/${encodePathSegment(resourceId)}`;
  if (!viewer?.trim()) return basePath;
  const search = new URLSearchParams({ viewer: viewer.trim() });
  return `${basePath}?${search.toString()}`;
};

export const buildResourcePathWithSearch = (
  target: Parameters<typeof buildResourcePath>[0],
  currentSearch?: string
): string => {
  const pathname = buildResourcePath({
    resourceType: target.resourceType,
    resourceId: target.resourceId,
  });
  const search = new URLSearchParams();
  const viewer = target.viewer?.trim();
  if (viewer) search.set('viewer', viewer);

  const isPdf = target.resourceType.trim().toLowerCase() === 'pdf' || viewer === 'pdfPreview';
  if (isPdf) {
    const previousSearch = new URLSearchParams(currentSearch);
    const page = previousSearch.get('page');
    const zoom = previousSearch.get('zoom');
    if (page) search.set('page', page);
    if (zoom) search.set('zoom', zoom);
  }

  return appendSearch(pathname, search);
};
