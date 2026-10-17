import './style.module.less';

import { useMount } from 'ahooks';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useJoyride } from 'react-joyride';

import {
  GUIDE_TOUR_CODE,
  GUIDE_TOURS,
  type GuideTourConfig,
  type GuideTourId,
} from '@/constants/tour';
import { useUserService } from '@/domains';
import { useApi } from '@/hooks/useApi';

import { getActivePageTourId, subscribeActivePageTour } from '../activePageTourStore';
import { compileGuideSteps } from '../compileGuideSteps';
import type { GuideActionPort } from '../guideActions';
import GuideSpotlight from '../GuideSpotlight';
import { useGuideTaskStore } from '../guideTaskStore';
import GuideTooltip, { GuideArrow } from '../GuideTooltip';
import type { GuideHostProps } from './index.type';

const GUIDE_Z_INDEX_FALLBACK = 1050;
const SCOPE_TRANSITION_GAP_MS = 500;

function readGuideZIndex(): number {
  const style = getComputedStyle(document.documentElement);
  const zIndex = Number.parseFloat(style.getPropertyValue('--app-z-index-guide'));
  return Number.isFinite(zIndex) && zIndex > 0 ? zIndex : GUIDE_Z_INDEX_FALLBACK;
}

let guideZIndex: number | null = null;

function getGuideZIndex(): number {
  if (!guideZIndex) guideZIndex = readGuideZIndex();
  return guideZIndex;
}

interface GuidePlayerProps {
  tour: GuideTourConfig;
  actions: GuideActionPort;
  onFinished: () => void;
}

/** 当前一条指引。换一条时整段重挂，从第一步重新开始。 */
function GuidePlayer({ tour, actions, onFinished }: GuidePlayerProps) {
  const { t } = useTranslation('tour');
  const zIndex = getGuideZIndex();
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

  const {
    controls,
    on,
    step: activeStep,
    Tour,
  } = useJoyride({
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
      arrowBase: 20,
      arrowSize: 10,
      arrowSpacing: 16,
      buttons: ['back', 'skip', 'primary'],
      dismissKeyAction: false,
      showProgress: true,
      skipBeacon: true,
      zIndex: zIndex + 2,
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
   * 执行时机：指引还在播放时，document 捕获阶段的按下、点击和焦点，以及弹出层把卡片标成 inert 时。
   * 不可替代原因：模态弹出层会把卡片标成 inert，pointer-events 挡不住；目标菜单异步挂载后还会主动聚焦，必须把焦点拉回引导按钮。
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
    const keepGuideFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      const tip = document.querySelector('[data-guide-tooltip]');
      if (!(tip instanceof HTMLElement) || tip.contains(event.target)) return;
      const primary = tip.querySelector<HTMLElement>('[data-action="primary"]');
      primary?.focus({ preventScroll: true });
    };
    for (const type of pointerEvents) window.addEventListener(type, blockPageEvent, true);
    window.addEventListener('click', onClick, true);
    document.addEventListener('focusin', keepGuideFocus, true);
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('guide-pointer-lock');
      for (const type of pointerEvents) window.removeEventListener(type, blockPageEvent, true);
      window.removeEventListener('click', onClick, true);
      document.removeEventListener('focusin', keepGuideFocus, true);
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

  const activeStepConfig = activeStep
    ? tour.steps.find((item) => item.id === activeStep.id)
    : undefined;
  /**
   * @wisepen-manual-memo
   * 为什么：同一配置对象在步骤内引用稳定，而默认目标需要按配置生成数组；每次渲染新建数组会让遮罩反复重挂并重置测量。
   * 收益：同一指引步骤内复用同一份高亮目标，避免无意义的重渲染与位置跳动。
   * 失效条件：切换步骤或步骤配置的高亮目标变化时必须重建。
   */
  const spotlightToolIds = useMemo(
    () => activeStepConfig?.spotlightToolIds ?? (activeStepConfig ? [activeStepConfig.toolId] : []),
    [activeStepConfig]
  );

  if (!run) return null;
  return (
    <>
      {spotlightToolIds.length > 0 ? (
        <GuideSpotlight
          key={activeStepConfig?.id}
          toolIds={spotlightToolIds}
          padding={activeStepConfig?.spotlightPadding}
          zIndex={zIndex + 1}
        />
      ) : null}
      {Tour}
    </>
  );
}

/** 新手指引宿主。按后端引导记录决定是否播放，并在结束时汇报完成状态。 */
function GuideHost({ shellTourId, actions }: GuideHostProps) {
  const userService = useUserService();
  const tourStatusLoaded = useGuideTaskStore((state) => state.loaded);
  const pendingByTourId = useGuideTaskStore((state) => state.pendingByTourId);
  const beginLoading = useGuideTaskStore((state) => state.beginLoading);
  const loadTourStatuses = useGuideTaskStore((state) => state.loadTourStatuses);
  const finishLoading = useGuideTaskStore((state) => state.finishLoading);
  const markCompleted = useGuideTaskStore((state) => state.markCompleted);
  const { run: loadTourStatus } = useApi(() => userService.listTourStatus(), {
    manual: true,
    showErrorToast: false,
    onSuccess: loadTourStatuses,
    onError: finishLoading,
  });

  useMount(() => {
    if (beginLoading()) void loadTourStatus();
  });

  const pageTourId = useSyncExternalStore(
    subscribeActivePageTour,
    getActivePageTourId,
    getActivePageTourId
  );
  const activeTourId: GuideTourId | null =
    shellTourId && pendingByTourId[shellTourId]
      ? shellTourId
      : pageTourId && pendingByTourId[pageTourId]
        ? pageTourId
        : null;

  const [visibleTourId, setVisibleTourId] = useState<GuideTourId | null>(null);
  const previousTourId = useRef<GuideTourId | null>(null);

  /**
   * @wisepen-manual-effect
   * 执行时机：当前 scope 切换时。
   * 不可替代原因：上一条指引结束会立刻挂载下一条，遮罩没有消失窗口，用户感知不到 scope 已完成。
   * cleanup：清掉尚未触发的延时，避免页面切换后把旧 scope 的指引重新挂出来。
   */
  useEffect(() => {
    const previous = previousTourId.current;
    previousTourId.current = activeTourId;
    if (!activeTourId) return undefined;

    // 两条 scope 之间留出空档；首次出现或页面重新挂载时立即展示。
    const delay = previous && previous !== activeTourId ? SCOPE_TRANSITION_GAP_MS : 0;
    const timer = window.setTimeout(() => setVisibleTourId(activeTourId), delay);
    return () => window.clearTimeout(timer);
  }, [activeTourId]);

  const handleFinished = (tourId: GuideTourId) => {
    markCompleted(tourId);
    void userService.completeTour(GUIDE_TOUR_CODE[tourId]).catch(() => undefined);
  };

  const renderedTourId = visibleTourId === activeTourId ? visibleTourId : null;
  const renderedTour = renderedTourId ? GUIDE_TOURS[renderedTourId] : null;

  if (!tourStatusLoaded || !renderedTour || !renderedTourId) return null;
  return (
    <GuidePlayer
      key={renderedTourId}
      tour={renderedTour}
      actions={actions}
      onFinished={() => handleFinished(renderedTourId)}
    />
  );
}

export default GuideHost;
