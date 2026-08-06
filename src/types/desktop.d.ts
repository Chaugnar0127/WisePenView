import type { DesktopNavigationState } from '../../electron/shared/channels';

declare global {
  /** Node `process.platform` 子集，由 preload 同步注入 */
  type DesktopNodePlatform = 'darwin' | 'win32' | 'linux';

  interface DesktopBridge {
    /** Node process.platform（同步可读，供快捷键文案等） */
    readonly platform: DesktopNodePlatform;
    isFullScreen(): boolean;
    onFullScreenChange(listener: (value: boolean) => void): () => void;
    isMaximized?(): boolean;
    onMaximizedChange?(listener: (value: boolean) => void): () => void;
    getNavigationState(): DesktopNavigationState;
    onNavigationStateChange(listener: () => void): () => void;
    navigationBack(): Promise<boolean>;
    navigationForward(): Promise<boolean>;
    setColorScheme?(scheme: string): Promise<void>;
    getAppVersion(): Promise<string>;
    openExternal(url: string): Promise<boolean>;
    windowMinimize?(): Promise<void>;
    windowMaximizeToggle?(): Promise<void>;
    windowClose?(): Promise<void>;
    savePdfFromHtml(options: { html: string; defaultFileName: string }): Promise<string | null>;
  }

  interface Window {
    readonly desktop?: DesktopBridge;
  }
}

export {};
