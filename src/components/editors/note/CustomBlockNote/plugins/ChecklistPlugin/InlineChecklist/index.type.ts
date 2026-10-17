import type { ColorKey } from '@/components/editors/note/CustomBlockNote/ui/editorMenus/colorPaletteData';

import type { InlineChecklistColor, InlineChecklistMode } from '../model';

export type InlineChecklistToolbarPosition = {
  top: number;
  left: number;
};

export type InlineChecklistColorPatch = {
  checklistBorderColor?: ColorKey;
  checklistBackgroundColor?: ColorKey;
};

export type InlineChecklistModeToolbarProps = {
  mode: InlineChecklistMode;
  borderColor: InlineChecklistColor;
  backgroundColor: InlineChecklistColor;
  colorPanelOpen: boolean;
  canJoinPrevious: boolean;
  onModeChange: (mode: InlineChecklistMode) => void;
  onBorderColorChange: (color: ColorKey) => void;
  onBackgroundColorChange: (color: ColorKey) => void;
  onResetColors: () => void;
  onToggleColorPanel: () => void;
  onJoinPrevious: () => void;
  onSplitGroup: () => void;
};
