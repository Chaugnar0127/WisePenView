import { appendRedirectParam } from '@/bootstrap/authContinuation';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useUserService } from '@/domains';
import { useApi } from '@/hooks/useApi';
import { APP_ROUTE_PATH } from '@/utils/navigation/appRoute';
import { toast } from '@heroui/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppAuthContext, type AppAuthContextValue, type AppAuthMode } from './AppAuthContext';

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

  useApi(() => userService.getUserInfo({ forceRefresh: true }), {
    ready: mode === 'anonymous',
    showErrorToast: false,
    onSuccess: () => {
      sessionStorage.removeItem(STORAGE_KEYS.anonymousAuthCheckNotified);
      navigate(APP_ROUTE_PATH.CHAT, { replace: true });
    },
    onErrorEffect: () => {
      if (sessionStorage.getItem(STORAGE_KEYS.anonymousAuthCheckNotified) === 'true') return;
      sessionStorage.setItem(STORAGE_KEYS.anonymousAuthCheckNotified, 'true');
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
