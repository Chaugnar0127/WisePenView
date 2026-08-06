/** HeroUI Tooltip.Trigger 可聚焦；包真实控件时用此 props 避免双 Tab / 双 focus */
export const TOOLTIP_FOCUS_PASSTHROUGH_PROPS = {
  tabIndex: -1 as const,
  'data-focus-passthrough': '',
};
