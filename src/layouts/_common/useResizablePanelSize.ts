import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { useRef, type RefObject } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';

type ResizablePanelSize = number | string;

interface UseResizablePanelSizeOptions {
  panelRef: RefObject<PanelImperativeHandle | null>;
  size: ResizablePanelSize;
  enabled?: boolean;
}

/** 同步外部折叠状态到 react-resizable-panels 的命令式尺寸模型。 */
export function useResizablePanelSize({
  panelRef,
  size,
  enabled = true,
}: UseResizablePanelSizeOptions) {
  const resizeFrameRef = useRef<number | null>(null);

  const cancelDeferredResize = () => {
    if (resizeFrameRef.current === null) return;
    window.cancelAnimationFrame(resizeFrameRef.current);
    resizeFrameRef.current = null;
  };

  const resizePanel = () => {
    if (!enabled) return;
    panelRef.current?.resize(size);
  };

  const syncPanelSize = () => {
    cancelDeferredResize();
    resizePanel();
    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      resizePanel();
    });
  };

  useMount(() => {
    syncPanelSize();
  });

  useUpdateEffect(() => {
    syncPanelSize();
  }, [enabled, size]);

  useUnmount(cancelDeferredResize);
}
