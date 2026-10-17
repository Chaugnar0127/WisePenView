import './style.module.less';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useJoyride } from 'react-joyride';

import {
  GUIDE_ENABLED,
  GUIDE_TOURS,
  type GuideTourConfig,
  type GuideTourId,
} from '@/constants/tour';

import { compileGuideSteps } from '../compileGuideSteps';
import type { GuideActionPort } from '../guideActions';
import GuideTooltip, { GuideArrow } from '../GuideTooltip';
import { getPageTourId, subscribePageTours } from '../pageTourRegistry';
import type { GuideHostProps } from './index.type';

const GUIDE_Z_INDEX_FALLBACK = 1050;

function readGuideChrome(): { spotlightRadius: number; zIndex: number } {
  const style = getComputedStyle(document.documentElement);
  const radius = Number.parseFloat(style.getPropertyValue('--radius'));
  const zIndex = Number.parseFloat(style.getPropertyValue('--app-z-index-guide'));
  return {
    spotlightRadius: Number.isFinite(radius) ? radius : 0,
    zIndex: Number.isFinite(zIndex) && zIndex > 0 ? zIndex : GUIDE_Z_INDEX_FALLBACK,
  };
}

let guideChrome: { spotlightRadius: number; zIndex: number } | null = null;

function getGuideChrome(): { spotlightRadius: number; zIndex: number } {
  if (!guideChrome) guideChrome = readGuideChrome();
  return guideChrome;
}

interface GuidePlayerProps {
  tour: GuideTourConfig;
  actions: GuideActionPort;
  onFinished: () => void;
}

/** 当前一条指引。换一条时整段重挂，从第一步重新开始。 */
function GuidePlayer({ tour, actions, onFinished }: GuidePlayerProps) {
  const { t } = useTranslation('tour');
  const { spotlightRadius, zIndex } = getGuideChrome();
  const [run, setRun] = useState(true);
  const backTo = useRef<number | null>(null);
  const backAttempts = useRef(0);

  /**
   * @wisepen-manual-memo
   * 为什么：Joyride 用 steps 引用判断步骤有没有换；每次渲染新建数组会把正在播放的步骤打回起点。
   * 收益：文案和准备动作不变时，不重建 steps 引用。
   * 失效条件：指引或语言变化时必须重建，否则气泡文案会停在旧语言。
   */
  const steps = useMemo(
    () => compileGuideSteps(tour, (key) => t(key), actions),
    [actions, tour, t]
  );

  const { controls, on, Tour } = useJoyride({
    continuous: true,
    run,
    steps,
    arrowComponent: GuideArrow,
    tooltipComponent: GuideTooltip,
    locale: {
      back: t('controls.back'),
      last: t('controls.last'),
      next: t('controls.next'),
      nextWithProgress: t('controls.nextWithProgress'),
      skip: t('controls.skip'),
    },
    options: {
      arrowColor: 'var(--surface)',
      blockTargetInteraction: true,
      buttons: ['back', 'skip', 'primary'],
      dismissKeyAction: false,
      overlayClickAction: false,
      overlayColor: 'color-mix(in oklab, var(--foreground) 40%, transparent)',
      showProgress: true,
      skipBeacon: true,
      spotlightRadius,
      zIndex,
    },
    // 模态打开时 body 是 pointer-events: none，气泡必须自己接点击，否则会落到遮罩上。
    styles: {
      floater: {
        pointerEvents: 'auto',
      },
    },
  });

  /**
   * @wisepen-manual-effect
   * 执行时机：指引还在播放时，document 捕获阶段的按下和点击，以及弹出层把卡片标成 inert 时。
   * 不可替代原因：模态弹出层会把卡片标成 inert，pointer-events 挡不住；只拦 document 上的 click 也挡不住弹出层的 pointerup。
   * cleanup：指引结束或换一条时卸下监听，避免遮罩拆掉后页面仍然点不了。
   */
  useEffect(() => {
    if (!run) return undefined;
    document.documentElement.classList.add('guide-pointer-lock');

    const releaseGuideCard = () => {
      const tip = document.querySelector('[data-guide-tooltip]');
      if (!(tip instanceof HTMLElement)) return;
      let node: HTMLElement | null = tip;
      while (node && node !== document.body && node !== document.documentElement) {
        if (node.inert) node.inert = false;
        node = node.parentElement;
      }
    };
    releaseGuideCard();
    const observer = new MutationObserver(releaseGuideCard);
    observer.observe(document.body, {
      attributeFilter: ['inert'],
      attributes: true,
      childList: true,
      subtree: true,
    });

    const findGuideTooltip = (event: Event) => {
      for (const node of event.composedPath()) {
        if (node instanceof Element && node.hasAttribute('data-guide-tooltip')) return node;
      }
      const raw = event.target;
      const element = raw instanceof Element ? raw : raw instanceof Node ? raw.parentElement : null;
      return element?.closest('[data-guide-tooltip]') ?? null;
    };

    const blockPageEvent = (event: Event) => {
      if (!event.isTrusted) return;
      if (findGuideTooltip(event)) {
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onClick = (event: Event) => {
      if (!event.isTrusted) return;
      const tooltip = findGuideTooltip(event);
      if (!tooltip) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const fromTarget =
        event.target instanceof Element
          ? event.target
          : event.target instanceof Node
            ? event.target.parentElement
            : null;
      const resolved = fromTarget?.closest('[data-action]')?.getAttribute('data-action') ?? null;
      if (resolved === 'primary') {
        backTo.current = null;
        controls.next();
      } else if (resolved === 'back') {
        const dest = Math.max(0, controls.info().index - 1);
        backTo.current = dest;
        backAttempts.current = 0;
        controls.prev();
      } else if (resolved === 'skip') {
        backTo.current = null;
        controls.skip();
      }
    };

    const pointerEvents = ['pointerdown', 'pointerup', 'mousedown', 'mouseup'] as const;
    for (const type of pointerEvents) window.addEventListener(type, blockPageEvent, true);
    window.addEventListener('click', onClick, true);
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('guide-pointer-lock');
      for (const type of pointerEvents) window.removeEventListener(type, blockPageEvent, true);
      window.removeEventListener('click', onClick, true);
    };
  }, [controls, run]);

  /**
   * @wisepen-manual-effect
   * 执行时机：某一步的气泡已经显示。
   * 不可替代原因：上一步的弹出层要等这一步挂上再关，否则目标被卸掉，下一步不会出现。
   * cleanup：退订事件。
   */
  useEffect(() => {
    const placeBack = () => {
      const dest = backTo.current;
      if (dest == null || controls.info().index === dest) return;
      if (backAttempts.current >= 2) {
        backTo.current = null;
        return;
      }
      backAttempts.current += 1;
      controls.go(dest);
    };
    const unTooltip = on('tooltip', (data) => {
      if (backTo.current != null && data.index !== backTo.current) {
        placeBack();
        return;
      }
      const stepId = typeof data.step.id === 'string' ? data.step.id : undefined;
      actions.flushPending(stepId);
      if (backTo.current != null && data.index === backTo.current) backTo.current = null;
    });
    const unMissing = on('error:target_not_found', () => {
      requestAnimationFrame(placeBack);
    });
    return () => {
      unTooltip();
      unMissing();
    };
  }, [actions, controls, on]);

  /**
   * @wisepen-manual-effect
   * 执行时机：整条指引结束。
   * 不可替代原因：跳过或完成时不会走步骤的 restore；Joyride 结束后会把状态复位，run 仍为 true 时遮罩还挂在页面上。
   * cleanup：退订事件。
   */
  useEffect(() => {
    return on('tour:end', () => {
      actions.closeAll();
      setRun(false);
      onFinished();
    });
  }, [actions, on, onFinished]);

  if (!run) return null;
  return Tour;
}

/** 新手指引宿主。不读取、不写入是否已看过。 */
function GuideHost({ shellTourId, actions }: GuideHostProps) {
  const pageTourId = useSyncExternalStore(subscribePageTours, getPageTourId, getPageTourId);
  const [shellFinished, setShellFinished] = useState(false);
  const shellTour = shellTourId ? GUIDE_TOURS[shellTourId] : null;
  const pageTour = pageTourId ? GUIDE_TOURS[pageTourId] : null;
  const showShellTour = !shellFinished && shellTour !== null;
  const activeTour = showShellTour ? shellTour : pageTour;
  const activeTourId: GuideTourId | null = showShellTour ? (shellTourId ?? null) : pageTourId;

  if (!GUIDE_ENABLED || !activeTour || !activeTourId) return null;
  return (
    <GuidePlayer
      key={activeTourId}
      tour={activeTour}
      actions={actions}
      onFinished={() => {
        if (!shellFinished && shellTour) setShellFinished(true);
      }}
    />
  );
}

export default GuideHost;
