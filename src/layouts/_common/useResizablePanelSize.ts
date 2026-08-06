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
  /**
   * 尺寸写入后回调（含动画每一帧）。
   * 经 ref 读取，不进入 resize effect 依赖，避免打断插值。
   */
  onSizePixels?: (sizePx: number) => void;
  /**
   * 本次尺寸同步结束（插值到达目标或瞬时写入完成）。
   * 经 ref 读取，不进入 resize effect 依赖。
   */
  onComplete?: () => void;
}

/** 短促 ease-out，收起/展开更跟手 */
const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const toPixelSize = (size: ResizablePanelSize): number | null =>
  typeof size === 'number' && Number.isFinite(size) ? size : null;

/** 同步外部折叠状态到 react-resizable-panels 的命令式尺寸模型。 */
export function useResizablePanelSize({
  panelRef,
  size,
  enabled = true,
  animate = false,
  durationMs = 200,
  onSizePixels,
  onComplete,
}: UseResizablePanelSizeOptions) {
  const frameRef = useRef<number | null>(null);
  const onSizePixelsRef = useRef(onSizePixels);
  const onCompleteRef = useRef(onComplete);

  /**
   * @wisepen-manual-effect
   * 执行时机：回调引用变化时更新 ref，供 resize 动画帧读取最新回调。
   * 不可替代原因：不能把回调放进 resize effect 依赖，否则会打断插值。
   * cleanup：无。
   */
  useEffect(() => {
    onSizePixelsRef.current = onSizePixels;
    onCompleteRef.current = onComplete;
  }, [onComplete, onSizePixels]);

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

    const reportSize = (sizePx: number) => {
      onSizePixelsRef.current?.(sizePx);
    };

    const finish = () => {
      /* 先让最终宽度完成绘制，再清 isAnimating，避免同帧 DOM/约束切换叠在最后一击 resize 上 */
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        onCompleteRef.current?.();
      });
    };

    const resizeTo = (next: ResizablePanelSize) => {
      panelRef.current?.resize(next);
      const px = toPixelSize(next) ?? panelRef.current?.getSize().inPixels;
      if (px != null && Number.isFinite(px)) {
        reportSize(px);
      }
    };

    const panel = panelRef.current;
    if (!panel) {
      frameRef.current = window.requestAnimationFrame(() => {
        resizeTo(size);
        finish();
      });
      return cancelFrame;
    }

    const targetPx = toPixelSize(size);
    const currentPx = panel.getSize().inPixels;

    if (!animate || targetPx == null || !Number.isFinite(currentPx)) {
      resizeTo(size);
      frameRef.current = window.requestAnimationFrame(() => {
        resizeTo(size);
        finish();
      });
      return cancelFrame;
    }

    const startPx = currentPx;
    const delta = targetPx - startPx;
    if (Math.abs(delta) < 0.5) {
      resizeTo(targetPx);
      finish();
      return cancelFrame;
    }

    let startedAt: number | null = null;
    const tick = (now: number) => {
      if (startedAt == null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const next = startPx + delta * easeOutCubic(progress);
      resizeTo(next);
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        resizeTo(targetPx);
        finish();
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return cancelFrame;
  }, [animate, durationMs, enabled, panelRef, size]);
}
