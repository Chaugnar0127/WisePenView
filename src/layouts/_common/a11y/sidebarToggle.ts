export const APP_SIDEBAR_TOGGLE_ATTR = 'data-app-sidebar-toggle';

export const SIDEBAR_TOGGLE_BUTTON_PROPS = {
  [APP_SIDEBAR_TOGGLE_ATTR]: '',
} as const;

/** 焦点归还到可见侧栏切换按钮（双 rAF：等收起 chrome / inert 提交后再查） */
export function focusVisibleSidebarToggle(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const nodes = document.querySelectorAll<HTMLElement>(`[${APP_SIDEBAR_TOGGLE_ATTR}]`);
      for (const node of nodes) {
        if (node.closest('[inert]')) continue;
        if (node.closest('[aria-hidden="true"]')) continue;
        node.focus();
        return;
      }
    });
  });
}
