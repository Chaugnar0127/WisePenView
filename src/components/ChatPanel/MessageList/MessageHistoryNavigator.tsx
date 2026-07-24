import { useMessageScroller, useMessageScrollerVisibility } from '@/components/_shadcn';
import type { WisePenUIMessage } from '@/domains/Chat';
import { useUnmount, useUpdateEffect } from 'ahooks';
import { isTextUIPart } from 'ai';
import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import styles from './style.module.less';

const PREVIEW_LENGTH = 28;
const OPEN_DELAY_MS = 24;
const CLOSE_DELAY_MS = 140;

interface MessageHistoryNavigatorProps {
  messages: WisePenUIMessage[];
  scrollAnchorOffsetRatio: number;
}

interface UserMessageAnchor {
  id: string;
  preview: string;
}

function getMessagePreview(message: WisePenUIMessage, maxLength: number): string {
  const text = message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('')
    .replaceAll(/\s+/g, ' ')
    .trim();

  if (!text) {
    return message.metadata?.selectedAttachments?.length ? '附件消息' : '空消息';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function useUserMessageAnchors(messages: WisePenUIMessage[]) {
  return messages
    .filter((message) => message.role === 'user')
    .map((message) => ({
      id: message.id,
      preview: getMessagePreview(message, PREVIEW_LENGTH),
    }));
}

/** 持续跟随 MessageScroller 的 scroll-spy（user 消息带 scrollAnchor） */
function useActiveHistoryAnchorId(anchors: UserMessageAnchor[]) {
  const { currentAnchorId } = useMessageScrollerVisibility();
  if (!currentAnchorId) return null;
  return anchors.some((anchor) => anchor.id === currentAnchorId) ? currentAnchorId : null;
}

function scrollActiveItemIntoView(container: HTMLElement | null, activeAnchorId: string | null) {
  if (!container || !activeAnchorId) return;
  const activeItem = container.querySelector<HTMLElement>(
    `[data-anchor-id="${CSS.escape(activeAnchorId)}"]`
  );
  activeItem?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function HistoryBar({ active, anchorId }: { active: boolean; anchorId?: string }) {
  return (
    <span
      className={styles.historyNavigatorBar}
      data-active={active ? 'true' : 'false'}
      data-anchor-id={anchorId}
      aria-hidden="true"
    />
  );
}

/** 右侧垂直居中横条轨；hover / 点击展开文案浮层 */
function MessageHistoryNavigator({
  messages,
  scrollAnchorOffsetRatio,
}: MessageHistoryNavigatorProps) {
  const anchors = useUserMessageAnchors(messages);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scrollToMessage } = useMessageScroller();
  const activeAnchorId = useActiveHistoryAnchorId(anchors);

  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleOpen = () => {
    clearTimers();
    openTimerRef.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const handleJumpToMessage = (messageId: string) => {
    scrollToMessage(messageId, {
      behavior: 'smooth',
      align: 'start',
      scrollMargin: (viewport) => viewport.clientHeight * scrollAnchorOffsetRatio,
    });
    setOpen(false);
  };

  useUnmount(() => {
    clearTimers();
  });

  useUpdateEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  /* 高亮条变化时把亮条滚进可视区 */
  useLayoutEffect(() => {
    const container = open ? panelRef.current : railRef.current;
    scrollActiveItemIntoView(container, activeAnchorId);
  }, [open, activeAnchorId, anchors.length]);

  if (anchors.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className={clsx(
        styles.historyNavigator,
        styles.historyNavigatorRail,
        open && styles.historyNavigatorRailOpen
      )}
      data-open={open ? 'true' : 'false'}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocusCapture={scheduleOpen}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) {
          scheduleClose();
        }
      }}
    >
      <div className={styles.historyNavigatorRailTriggerWrap}>
        <button
          ref={railRef}
          type="button"
          className={styles.historyNavigatorRailTrigger}
          aria-label="历史提问"
          aria-expanded={open}
          aria-controls="chat-history-navigator-panel"
          tabIndex={open ? -1 : 0}
          onClick={() => {
            clearTimers();
            setOpen((prev) => !prev);
          }}
        >
          {anchors.map((anchor) => (
            <HistoryBar
              key={anchor.id}
              anchorId={anchor.id}
              active={anchor.id === activeAnchorId}
            />
          ))}
        </button>
      </div>

      <div
        ref={panelRef}
        id="chat-history-navigator-panel"
        className={styles.historyNavigatorRailPanel}
        role="listbox"
        aria-label="历史提问"
        aria-hidden={!open}
        inert={!open}
        data-open={open ? 'true' : 'false'}
      >
        {anchors.map((anchor) => {
          const isActive = anchor.id === activeAnchorId;
          return (
            <button
              key={anchor.id}
              type="button"
              role="option"
              data-anchor-id={anchor.id}
              aria-selected={isActive}
              className={styles.historyNavigatorRailItem}
              data-active={isActive ? 'true' : 'false'}
              tabIndex={open ? 0 : -1}
              onClick={() => handleJumpToMessage(anchor.id)}
            >
              <span className={styles.historyNavigatorRailPreview}>{anchor.preview}</span>
              <HistoryBar active={isActive} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MessageHistoryNavigator;
