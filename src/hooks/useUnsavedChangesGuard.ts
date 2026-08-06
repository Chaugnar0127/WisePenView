import { useBeforeUnload, useBlocker } from 'react-router-dom';

export interface UnsavedChangesGuard {
  isBlocked: boolean;
  proceed: () => void;
  reset: () => void;
}

export function useUnsavedChangesGuard(enabled: boolean): UnsavedChangesGuard {
  const blocker = useBlocker(enabled);

  useBeforeUnload(
    (event) => {
      if (!enabled) return;
      event.preventDefault();
      event.returnValue = '';
    },
    { capture: true }
  );

  return {
    isBlocked: blocker.state === 'blocked',
    proceed: () => blocker.proceed?.(),
    reset: () => blocker.reset?.(),
  };
}
