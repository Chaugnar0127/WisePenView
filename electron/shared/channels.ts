export interface DesktopNavigationState {
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

export const DESKTOP_CHANNEL = {
  getAppVersion: 'desktop:get-app-version',
  openExternal: 'desktop:open-external',
  savePdfFromHtml: 'desktop:save-pdf-from-html',
  fullScreenChanged: 'desktop:full-screen-changed',
  maximizedChanged: 'desktop:maximized-changed',
  windowMinimize: 'desktop:window-minimize',
  windowMaximizeToggle: 'desktop:window-maximize-toggle',
  windowClose: 'desktop:window-close',
  navigationStateChanged: 'desktop:navigation-state-changed',
  navigationBack: 'desktop:navigation-back',
  navigationForward: 'desktop:navigation-forward',
} as const;
