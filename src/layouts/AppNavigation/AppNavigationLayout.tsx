import { useKeyPress } from 'ahooks';
import { useState, useSyncExternalStore } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppNavigationContext, type AppNavigationContextValue } from './AppNavigationContext';
import CommandPalette from './CommandPalette';

const HISTORY_BACK = 1;
const HISTORY_FORWARD = 2;

const subscribeHistory = (listener: () => void): (() => void) =>
  window.desktop?.onNavigationStateChange(listener) ?? (() => undefined);

const getHistorySnapshot = (): number => {
  const state = window.desktop?.getNavigationState();
  return (state?.canGoBack ? HISTORY_BACK : 0) | (state?.canGoForward ? HISTORY_FORWARD : 0);
};

function AppNavigationLayout() {
  const navigate = useNavigate();
  const historySnapshot = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => 0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useKeyPress(
    ['ctrl.k', 'meta.k'],
    (event) => {
      event.preventDefault();
      setCommandPaletteOpen((open) => !open);
    },
    { exactMatch: true }
  );

  const canGoBack = (historySnapshot & HISTORY_BACK) !== 0;
  const canGoForward = (historySnapshot & HISTORY_FORWARD) !== 0;
  const value: AppNavigationContextValue = {
    canGoBack,
    canGoForward,
    goBack: () => {
      if (window.desktop) {
        void window.desktop.navigationBack();
        return;
      }
      void navigate(-1);
    },
    goForward: () => {
      if (window.desktop) {
        void window.desktop.navigationForward();
        return;
      }
      void navigate(1);
    },
    openCommandPalette: () => setCommandPaletteOpen(true),
  };

  return (
    <AppNavigationContext.Provider value={value}>
      <Outlet />
      <CommandPalette isOpen={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </AppNavigationContext.Provider>
  );
}

export default AppNavigationLayout;
