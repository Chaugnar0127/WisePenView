import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { APP_HEADER_NAV_KEY, appRouteHandle } from '@/bootstrap/routeMeta';
import AdminLayout from '@/layouts/Admin/AdminLayout';
import AppLayout from '@/layouts/App/AppLayout';
import AppNavigationLayout from '@/layouts/AppNavigation/AppNavigationLayout';
import AuthLayout from '@/layouts/Auth/AuthLayout';
import CourseLayout from '@/layouts/Course/CourseLayout';
import CourseLearningLayout from '@/layouts/Course/CourseLearningLayout';
import HomeLayout from '@/layouts/Home/HomeLayout';
import PublicLayout from '@/layouts/Public/PublicLayout';
import WorkspaceLayout from '@/layouts/Workspace/WorkspaceLayout';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import AdminRouteGuard from '@/views/admin/guard/AdminRouteGuard';
import AppError from '@/views/app/error/AppError';
import ResourceNotFound from '@/views/app/error/ResourceNotFound';
import RouteError from '@/views/app/error/RouteError';
import ScopedRouteNotFound from '@/views/app/error/ScopedRouteNotFound';
import AuthenticatedRouteGuard from '@/views/app/guard/AuthenticatedRouteGuard';

const UserManagement = lazy(() => import('@/views/admin/UserManagement'));
const ResourceManagement = lazy(() => import('@/views/admin/ResourceManagement'));
const GroupManagement = lazy(() => import('@/views/admin/GroupManagement'));
const AnnouncementManagement = lazy(() => import('@/views/admin/AnnouncementManagement'));
const DataStatistics = lazy(() => import('@/views/admin/DataStatistics'));
const PermissionManagement = lazy(() => import('@/views/admin/PermissionManagement'));
const SystemSettings = lazy(() => import('@/views/admin/SystemSettings'));
const LogAudit = lazy(() => import('@/views/admin/LogAudit'));
const TaskCenter = lazy(() => import('@/views/admin/TaskCenter'));
const Home = lazy(() => import('@/views/app/home'));
const Drive = lazy(() => import('@/views/app/drive/Drive'));
const PublicGroupsPage = lazy(() => import('@/views/app/public/PublicGroupsPage'));
const PublicCoursesPage = lazy(() => import('@/views/app/public/PublicCoursesPage'));
const PublicInvitePage = lazy(() => import('@/views/app/public/Invite'));
const GroupDetail = lazy(() => import('@/views/app/group/GroupDetail'));
const GroupRoute = lazy(() => import('@/views/app/group/GroupRoute'));
const GroupFilesPage = lazy(() => import('@/views/app/group/GroupDetail/_pages/GroupFilesPage'));
const GroupMembersPage = lazy(
  () => import('@/views/app/group/GroupDetail/_pages/GroupMembersPage')
);
const GroupWalletPage = lazy(() => import('@/views/app/group/GroupDetail/_pages/GroupWalletPage'));
const GroupTokenTransferPage = lazy(
  () => import('@/views/app/group/GroupDetail/_pages/GroupTokenTransferPage')
);
const GroupSettingsPage = lazy(
  () => import('@/views/app/group/GroupDetail/_pages/GroupSettingsPage')
);
const GroupWalletRouteGuard = lazy(
  () => import('@/views/app/group/GroupDetail/_guards/GroupWalletRouteGuard')
);
const Account = lazy(() => import('@/views/app/profile/Account'));
const Usage = lazy(() => import('@/views/app/profile/Usage'));
const Appearance = lazy(() => import('@/views/app/profile/Appearance'));
const Login = lazy(() => import('@/views/app/auth/Login'));
const Register = lazy(() => import('@/views/app/auth/Register'));
const AuthBindingOnboarding = lazy(() => import('@/views/app/auth/AuthBindingOnboarding'));
const ResetPassword = lazy(() => import('@/views/app/auth/ResetPassword'));
const NewPassword = lazy(() => import('@/views/app/auth/NewPassword'));
const VerifyEmail = lazy(() => import('@/views/app/auth/VerifyEmail'));
const WorkspaceResourceView = lazy(() => import('@/views/workspace/WorkspaceResourceView'));
const ChatPage = lazy(() => import('@/views/app/chat'));
const NotificationsPage = lazy(() => import('@/views/app/notifications'));
const CourseRoute = lazy(() => import('@/views/app/course/CourseRoute'));
const CourseContextPage = lazy(() => import('@/views/app/course/CourseContextPage'));
const CourseHomePage = lazy(
  () => import('@/views/app/course/CourseContextPage/_components/CourseHomeTab')
);
const CourseInfoPage = lazy(
  () => import('@/views/app/course/CourseContextPage/_components/CourseInfoTab')
);
const CourseAssignmentsPage = lazy(() => import('@/views/app/course/CourseAssignmentsPage'));
const CourseAssignmentDetailPage = lazy(
  () => import('@/views/app/course/CourseAssignmentDetailPage')
);
const CourseMaterialsPage = lazy(() => import('@/views/app/course/CourseMaterialsPage'));
const CourseMembersPage = lazy(() => import('@/views/app/course/CourseMembersPage'));
const CourseAnnouncementsPage = lazy(() => import('@/views/app/course/CourseAnnouncementsPage'));
const CourseEditorPage = lazy(() => import('@/views/app/course/CourseEditorPage'));
const CourseSettingsRouteGuard = lazy(
  () => import('@/views/app/course/_guards/CourseSettingsRouteGuard')
);

const chatHandle = appRouteHandle({
  pageKey: 'chat',
  headerNav: APP_HEADER_NAV_KEY.CHAT,
});
const chatSessionHandle = appRouteHandle({
  pageKey: 'chat',
  headerNav: APP_HEADER_NAV_KEY.CHAT,
});
const notificationHandle = appRouteHandle({
  pageKey: 'notifications',
  headerNav: APP_HEADER_NAV_KEY.NOTIFICATIONS,
});
const driveHandle = appRouteHandle({
  pageKey: 'drive',
  headerNav: APP_HEADER_NAV_KEY.DRIVE,
});
const groupHandle = (pageKey: string) =>
  appRouteHandle({
    pageKey,
    headerNav: APP_HEADER_NAV_KEY.PUBLIC,
  });
const courseHandle = (pageKey: string) =>
  appRouteHandle({
    pageKey,
    headerNav: APP_HEADER_NAV_KEY.PUBLIC,
  });
const publicInviteHandle = appRouteHandle({
  pageKey: 'invite',
  headerNav: APP_HEADER_NAV_KEY.PUBLIC,
});
const resourceHandle = appRouteHandle({
  pageKey: 'resource',
  headerNav: APP_HEADER_NAV_KEY.DRIVE,
});
const profileHandle = appRouteHandle({
  pageKey: 'profile',
});

const router = createBrowserRouter([
  {
    path: APP_ROUTE_PATH.HOME,
    element: <HomeLayout />,
    errorElement: <AppError />,
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <ResourceNotFound /> },
    ],
  },
  {
    path: APP_ROUTE_PATH.AUTH,
    element: <AuthLayout />,
    errorElement: <AppError />,
    children: [
      { index: true, element: <Navigate to={APP_ROUTE_PATH.AUTH_LOGIN} replace /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'onboarding/bind', element: <AuthBindingOnboarding /> },
      { path: 'password/forgot', element: <ResetPassword /> },
      { path: 'password/reset', element: <NewPassword /> },
      { path: 'email/verify', element: <VerifyEmail /> },
    ],
  },
  {
    path: APP_ROUTE_PATH.APP,
    element: <AuthenticatedRouteGuard />,
    errorElement: <AppError />,
    children: [
      {
        element: <AppNavigationLayout />,
        children: [
          {
            element: <AppLayout />,
            errorElement: <RouteError />,
            children: [
              { index: true, element: <Navigate to={APP_ROUTE_PATH.CHAT} replace /> },
              { path: 'chat', element: <ChatPage />, handle: chatHandle },
              { path: 'chat/:sessionId', element: <ChatPage />, handle: chatSessionHandle },
              {
                path: 'notifications',
                element: <NotificationsPage />,
                handle: notificationHandle,
              },
              {
                path: 'notifications/:messageId',
                element: <NotificationsPage />,
                handle: notificationHandle,
              },
              { path: 'drive', element: <Navigate to={APP_ROUTE_PATH.DRIVE_PERSONAL} replace /> },
              { path: 'drive/personal', element: <Drive />, handle: driveHandle },
              {
                path: 'drive/personal/folder/:folderId',
                element: <Drive />,
                handle: driveHandle,
              },
              {
                path: 'drive/upload-queue',
                element: <Drive viewMode="uploadQueue" />,
                handle: driveHandle,
              },
              {
                path: 'drive/favorites',
                element: <Drive viewMode="favorites" />,
                handle: driveHandle,
              },
              {
                path: 'drive/trash',
                element: <Drive viewMode="trash" />,
                handle: driveHandle,
              },
              {
                path: 'drive/trash/folder/:folderId',
                element: <Drive viewMode="trash" />,
                handle: driveHandle,
              },
              { index: true, element: <Navigate to={APP_ROUTE_PATH.GROUPS} replace /> },
              {
                element: <PublicLayout />,
                children: [
                  {
                    path: 'invite',
                    element: <PublicInvitePage />,
                    handle: publicInviteHandle,
                  },
                  {
                    path: 'groups',
                    element: <PublicGroupsPage />,
                    handle: groupHandle('groups.list'),
                  },
                  {
                    path: 'groups/:groupId',
                    element: <GroupRoute />,
                    children: [
                      {
                        index: true,
                        element: <Navigate to="files" replace />,
                      },
                      {
                        element: <GroupDetail />,
                        children: [
                          {
                            path: 'files',
                            element: <GroupFilesPage />,
                            handle: groupHandle('group.files'),
                          },
                          {
                            path: 'files/folder/:folderId',
                            element: <GroupFilesPage />,
                            handle: groupHandle('group.files'),
                          },
                          {
                            path: 'members',
                            element: <GroupMembersPage />,
                            handle: groupHandle('group.members'),
                          },
                          {
                            element: <GroupWalletRouteGuard />,
                            children: [
                              {
                                path: 'wallet',
                                element: <GroupWalletPage />,
                                handle: groupHandle('group.wallet'),
                              },
                              {
                                path: 'token-transfer',
                                element: <GroupTokenTransferPage />,
                                handle: groupHandle('group.tokenTransfer'),
                              },
                            ],
                          },
                          {
                            path: 'settings',
                            element: <GroupSettingsPage />,
                            handle: groupHandle('group.settings'),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: 'courses',
                    element: <PublicCoursesPage />,
                    handle: courseHandle('courses.list'),
                  },
                  {
                    path: 'courses/:courseId',
                    element: <CourseRoute />,
                    children: [
                      {
                        element: <CourseLayout />,
                        children: [
                          {
                            index: true,
                            element: <Navigate to="home" replace />,
                          },
                          {
                            element: <CourseContextPage />,
                            children: [
                              {
                                path: 'home',
                                element: <CourseHomePage />,
                                handle: courseHandle('course.home'),
                              },
                              {
                                path: 'info',
                                element: <CourseInfoPage />,
                                handle: courseHandle('course.info'),
                              },
                            ],
                          },
                          {
                            path: 'assignments',
                            element: <CourseAssignmentsPage />,
                            handle: courseHandle('course.assignments'),
                          },
                          {
                            path: 'assignments/:assignmentId',
                            element: <CourseAssignmentDetailPage />,
                            handle: courseHandle('course.assignment'),
                          },
                          {
                            path: 'materials',
                            element: <CourseMaterialsPage />,
                            handle: courseHandle('course.materials'),
                          },
                          {
                            path: 'announcements',
                            element: <CourseAnnouncementsPage />,
                            handle: courseHandle('course.announcements'),
                          },
                          {
                            path: 'members',
                            element: <CourseMembersPage />,
                            handle: courseHandle('course.members'),
                          },
                        ],
                      },
                      {
                        path: 'learning/:outlineNodeId?',
                        element: <CourseLearningLayout />,
                        handle: courseHandle('course.learning'),
                      },
                      {
                        element: <CourseSettingsRouteGuard />,
                        children: [
                          {
                            path: 'settings',
                            element: <CourseEditorPage />,
                            handle: courseHandle('course.settings'),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                path: 'profile',
                element: <Navigate to={APP_ROUTE_PATH.PROFILE_ACCOUNT} replace />,
              },
              { path: 'profile/usage', element: <Usage />, handle: profileHandle },
              { path: 'profile/account', element: <Account />, handle: profileHandle },
              { path: 'profile/appearance', element: <Appearance />, handle: profileHandle },
              {
                path: '*',
                element: (
                  <ScopedRouteNotFound homePath={APP_ROUTE_PATH.APP} homeLabelKey="page.backApp" />
                ),
                handle: appRouteHandle({
                  pageKey: 'app.notFound',
                }),
              },
            ],
          },
          {
            element: <WorkspaceLayout />,
            errorElement: <RouteError />,
            children: [
              {
                path: 'resources/:resourceType/:resourceId',
                element: <WorkspaceResourceView />,
                handle: resourceHandle,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: APP_ROUTE_PATH.ADMIN,
    element: <AdminRouteGuard />,
    errorElement: <AppError />,
    children: [
      {
        element: <AdminLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Navigate to={APP_ROUTE_PATH.ADMIN_USERS} replace /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'resources', element: <ResourceManagement /> },
          { path: 'groups', element: <GroupManagement /> },
          { path: 'announcements', element: <AnnouncementManagement /> },
          { path: 'statistics', element: <DataStatistics /> },
          { path: 'permissions', element: <PermissionManagement /> },
          { path: 'settings', element: <SystemSettings /> },
          { path: 'logs', element: <LogAudit /> },
          { path: 'tasks', element: <TaskCenter /> },
          {
            path: '*',
            element: (
              <ScopedRouteNotFound
                homePath={APP_ROUTE_PATH.ADMIN_USERS}
                homeLabelKey="page.backAdmin"
              />
            ),
          },
        ],
      },
    ],
  },
]);

export default router;
