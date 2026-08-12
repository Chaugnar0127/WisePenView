import { useChatPanelStore } from '@/components/ChatPanel/_store/useChatPanelStore';
import {
  CHAT_PANEL_MIN_WIDTH,
  clampWorkspaceChatPanelWidth,
  WORKSPACE_CHAT_PANEL_MAX_WIDTH,
} from '@/constants/layoutScale';
import { useResizablePanelSize } from '@/layouts/_common/useResizablePanelSize';
import { useMount } from 'ahooks';
import { useRef } from 'react';
import type {
  Layout,
  LayoutChangedMeta,
  PanelImperativeHandle,
  PanelSize,
} from 'react-resizable-panels';

export const useCourseChatDockController = () => {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const pendingWidthRef = useRef<number | null>(null);
  const collapsed = useChatPanelStore((state) => state.chatPanelCollapsed);
  const width = useChatPanelStore((state) => state.chatPanelWidth);
  const setCollapsed = useChatPanelStore((state) => state.setChatPanelCollapsed);
  const setWidth = useChatPanelStore((state) => state.setChatPanelWidth);
  const open = !collapsed;
  const panelSize = open ? clampWorkspaceChatPanelWidth(width) : 0;

  useResizablePanelSize({ panelRef, size: panelSize });

  useMount(() => setCollapsed(true));

  return {
    panelRef,
    collapsed,
    open,
    panelSize,
    minSize: open ? CHAT_PANEL_MIN_WIDTH : 0,
    maxSize: open ? WORKSPACE_CHAT_PANEL_MAX_WIDTH : 0,
    openPanel: () => setCollapsed(false),
    toggle: () => setCollapsed(!collapsed),
    handleResize: (size: PanelSize) => {
      if (open) pendingWidthRef.current = clampWorkspaceChatPanelWidth(size.inPixels);
    },
    handleLayoutChanged: (_layout: Layout, meta: LayoutChangedMeta) => {
      const pendingWidth = pendingWidthRef.current;
      pendingWidthRef.current = null;
      if (meta.isUserInteraction && open && pendingWidth != null) setWidth(pendingWidth);
    },
  };
};
