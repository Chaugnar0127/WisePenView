import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';

type ResizablePanelSize = number | string;

interface UseResizablePanelSizeOptions {
  panelRef: RefObject<PanelImperativeHandle | null>;
  size: ResizablePanelSize;
  enabled?: boolean;
  /** 程序化改尺寸时是否缓动（拖拽分栏勿开） */
  animate?: boolean;
  /** 缓动时长 ms，仅 animate 时生效 */
  durationMs?: number;
}

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const toPixelSize = (size: ResizablePanelSize): number | null =>
  typeof size === 'number' && Number.isFinite(size) ? size : null;

/** 同步外部折叠状态到 react-resizable-panels 的命令式尺寸模型。 */
export function useResizablePanelSize({
  panelRef,
  size,
  enabled = true,
  animate = false,
  durationMs = 300,
}: UseResizablePanelSizeOptions) {
  const frameRef = useRef<number | null>(null);

  /**
   * @wisepen-manual-effect
   * 执行时机：受控尺寸或启用状态变化时，同步命令式面板尺寸。
   * 不可替代原因：react-resizable-panels 通过 imperative handle 管理布局，不属于 React 渲染输出。
   * cleanup：取消进行中的 rAF 动画/补偿帧，避免卸载后改尺寸。
   */
  useEffect(() => {
    if (!enabled) return;

    const cancelFrame = () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const panel = panelRef.current;
    if (!panel) {
      const retry = window.requestAnimationFrame(() => panelRef.current?.resize(size));
      frameRef.current = retry;
      return cancelFrame;
    }

    const targetPx = toPixelSize(size);
    const currentPx = panel.getSize().inPixels;

    if (!animate || targetPx == null || !Number.isFinite(currentPx)) {
      const resizePanel = () => panelRef.current?.resize(size);
      resizePanel();
      frameRef.current = window.requestAnimationFrame(resizePanel);
      return cancelFrame;
    }

    const startPx = currentPx;
    const delta = targetPx - startPx;
    if (Math.abs(delta) < 0.5) {
      panel.resize(targetPx);
      return cancelFrame;
    }

    let startedAt: number | null = null;
    const tick = (now: number) => {
      if (startedAt == null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const next = startPx + delta * easeInOutCubic(progress);
      panelRef.current?.resize(next);
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        panelRef.current?.resize(targetPx);
        frameRef.current = null;
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return cancelFrame;
  }, [animate, durationMs, enabled, panelRef, size]);
}
