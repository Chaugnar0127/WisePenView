import { useMemoizedFn } from 'ahooks';
import { useLocation, useNavigate } from 'react-router-dom';

import { buildChatSessionLocation, getChatSessionId } from '@/utils/navigation/chatRoute';

export function useChatSessionRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectSession = useMemoizedFn((sessionId?: string, replace = false) =>
    navigate(buildChatSessionLocation(location, sessionId), { replace, flushSync: true })
  );

  return { sessionId: getChatSessionId(location), selectSession, locationKey: location.key };
}
