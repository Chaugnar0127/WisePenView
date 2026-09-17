/**
 * 侧栏切换按钮的 DOM 契约：壳层与侧栏组件共享同一标记，
 * 供焦点归还时在两侧（折叠 rail / 展开侧栏 / 窄屏顶栏）找回可见按钮。
 */
export const APP_SIDEBAR_TOGGLE_ATTR = 'data-app-sidebar-toggle';

/** 挂在侧栏切换按钮上的标记 props */
export const SIDEBAR_TOGGLE_BUTTON_PROPS = {
  [APP_SIDEBAR_TOGGLE_ATTR]: '',
} as const;
