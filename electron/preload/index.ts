import { contextBridge, ipcRenderer } from 'electron';
import { DESKTOP_CHANNEL } from '../shared/channels';

const nodePlatform = process.platform;
const platform =
  nodePlatform === 'darwin' || nodePlatform === 'win32' || nodePlatform === 'linux'
    ? nodePlatform
    : 'linux';
let fullScreen = false;
const fullScreenListeners = new Set<(value: boolean) => void>();

ipcRenderer.on(DESKTOP_CHANNEL.fullScreenChanged, (_event, value: unknown) => {
  if (typeof value !== 'boolean') return;
  fullScreen = value;
  fullScreenListeners.forEach((listener) => listener(value));
});

const desktopBridge = Object.freeze({
  platform,
  isFullScreen: (): boolean => fullScreen,
  onFullScreenChange: (listener: (value: boolean) => void): (() => void) => {
    fullScreenListeners.add(listener);
    return () => fullScreenListeners.delete(listener);
  },
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(DESKTOP_CHANNEL.getAppVersion),
  openExternal: (url: string): Promise<boolean> =>
    ipcRenderer.invoke(DESKTOP_CHANNEL.openExternal, url),
});

contextBridge.exposeInMainWorld('desktop', desktopBridge);
