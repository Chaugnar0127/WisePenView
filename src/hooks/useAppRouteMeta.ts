import type { AppRouteHandle, AppRouteMeta } from '@/bootstrap/routeMeta';
import { useMatches } from 'react-router-dom';

export function useAppRouteMeta(): AppRouteMeta | undefined {
  const matches = useMatches();
  const currentRoute = matches[matches.length - 1];
  return (currentRoute?.handle as AppRouteHandle | undefined)?.app;
}
