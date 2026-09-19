import { matchPath, matchRoutes, type Path } from 'react-router-dom';

import { APP_ROUTE_PATH, buildChatPath } from './appRoute';

type ChatLocation = Pick<Path, 'pathname'> & Partial<Path>;

export const getChatSessionId = (location: ChatLocation): string | undefined => {
  const chatRoute = matchRoutes([{ path: `${APP_ROUTE_PATH.CHAT}/:sessionId?` }], location)?.[0];
  if (!chatRoute) return new URLSearchParams(location.search).get('chat') || undefined;
  return chatRoute.params.sessionId;
};

/** 內嵌聊天只更新 chat query，保留資源／課程位置、檢視參數和錨點。 */
export const buildChatSessionLocation = (location: ChatLocation, sessionId?: string): Path => {
  const isChatPage = matchPath(`${APP_ROUTE_PATH.CHAT}/:sessionId?`, location.pathname) != null;
  const search = new URLSearchParams(location.search);
  if (isChatPage || !sessionId) search.delete('chat');
  else search.set('chat', sessionId);
  const query = search.toString();
  return {
    pathname: isChatPage ? buildChatPath(sessionId) : location.pathname,
    search: query ? `?${query}` : '',
    hash: location.hash ?? '',
  };
};
