import { appendRedirectParam } from '@/bootstrap/authContinuation';
import { useUserService } from '@/domains';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppAuthContext, type AppAuthContextValue, type AppAuthMode } from './AppAuthContext';

const ANONYMOUS_AUTH_CHECK_NOTIFIED_KEY = 'wisepen:anonymous-auth-check-notified';

interface AppAuthProviderProps {
  children: ReactNode;
  mode: AppAuthMode;
}

export function AppAuthProvider({ children, mode }: AppAuthProviderProps) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const userService = useUserService();
  const isAuthenticated = mode === 'authenticated';
  const loginPath = appendRedirectParam(APP_ROUTE_PATH.AUTH_LOGIN, APP_ROUTE_PATH.CHAT);

  useRequest(() => userService.getUserInfo({ forceRefresh: true }), {
    ready: mode === 'anonymous',
    onSuccess: () => {
      sessionStorage.removeItem(ANONYMOUS_AUTH_CHECK_NOTIFIED_KEY);
      navigate(APP_ROUTE_PATH.CHAT, { replace: true });
    },
    onError: () => {
      if (sessionStorage.getItem(ANONYMOUS_AUTH_CHECK_NOTIFIED_KEY) === 'true') return;
      sessionStorage.setItem(ANONYMOUS_AUTH_CHECK_NOTIFIED_KEY, 'true');
      toast.warning(t('anonymous.sessionExpired'));
    },
  });

  const value: AppAuthContextValue = {
    isAuthenticated,
    loginPath,
    requireLogin: () => {
      if (isAuthenticated) return;
      toast.warning(t('anonymous.loginRequired'));
    },
  };

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}
