import { FULL_WIDTH_MODEL_ICON_ONLY_MAX_WIDTH } from '@/constants/layoutScale';
import { useEffectForce } from '@/hooks/useEffectForce';
import { TextArea } from '@heroui/react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ChatInputStoreProvider } from './_store/ChatInputStoreProvider';
import AttachmentStrip from './AttachmentStrip';
import { ChatInputFileProvider } from './ChatInputFileContext';
import DocumentPickerModal from './DocumentPickerModal';
import DropOverlay from './DropOverlay';
import type { ChatInputProps } from './index.type';
import InputToolbar from './InputToolbar';
import OtherSkillModal from './OtherSkillModal';
import styles from './style.module.less';
import { useChatInputController } from './useChatInputController';

function ChatInputContent({
  onSend,
  onStop,
  sending,
  contextPreview,
  onClearContext,
  injectedAgents,
  preferredAgent,
  fullWidth = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputCardRef = useRef<HTMLDivElement>(null);
  const [compactModelTrigger, setCompactModelTrigger] = useState(false);
  const { attachmentStripProps, containerProps, dropOverlayProps, textAreaProps, toolbarProps } =
    useChatInputController({
      onSend,
      onStop,
      sending,
    });

  const syncCompactModelTrigger = useCallback((width: number) => {
    setCompactModelTrigger(width < FULL_WIDTH_MODEL_ICON_ONLY_MAX_WIDTH);
  }, []);

  /**
   * 执行时机：fullWidth 挂载后，以及输入卡片尺寸变化时。
   * 不可替代原因：模型按钮是否展示文案取决于输入区实宽，无法仅靠 fullWidth 判断。
   * cleanup：断开 ResizeObserver。
   */
  useEffectForce(() => {
    if (!fullWidth) {
      setCompactModelTrigger(false);
      return;
    }

    const inputCard = inputCardRef.current;
    if (!inputCard || typeof ResizeObserver === 'undefined') {
      syncCompactModelTrigger(window.innerWidth);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncCompactModelTrigger(entry.contentRect.width);
    });
    observer.observe(inputCard);
    syncCompactModelTrigger(inputCard.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [fullWidth, syncCompactModelTrigger]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 先压到 0 再读 scrollHeight，避免沿用错误的大高度
    textarea.style.height = '0px';
    const contentHeight = textarea.scrollHeight;
    const computedMax = window.getComputedStyle(textarea).maxHeight;
    const parsedMax = Number.parseFloat(computedMax);
    // calc(...) 时 parseFloat 为 NaN；侧栏与 fullWidth 共用同一回退上限
    const maxHeightPx = Number.isFinite(parsedMax) ? parsedMax : 16 * 16 + 16;
    const minHeightPx = Number.parseFloat(window.getComputedStyle(textarea).minHeight);
    const floor = Number.isFinite(minHeightPx) ? minHeightPx : 0;
    const nextHeight = Math.min(Math.max(contentHeight, floor), maxHeightPx);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = contentHeight > nextHeight ? 'auto' : 'hidden';
  }, [textAreaProps.value]);

  const modelIconOnly = !fullWidth || compactModelTrigger;

  return (
    <div
      className={styles.container}
      data-model-trigger={modelIconOnly ? 'icon' : 'default'}
      {...containerProps}
    >
      <div
        ref={inputCardRef}
        className={clsx(styles.inputCard, dropOverlayProps.visible && styles.inputCardDragOver)}
      >
        <AttachmentStrip {...attachmentStripProps} />

        {contextPreview ? (
          <div className={styles.contextAttachment}>
            <span className={styles.contextAttachmentPreview}>{contextPreview}</span>
            <button
              type="button"
              className={styles.contextAttachmentClear}
              aria-label="移除上下文"
              onClick={onClearContext}
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <TextArea
          {...textAreaProps}
          ref={textareaRef}
          placeholder="输入消息..."
          rows={1}
          className={styles.textarea}
        />

        <InputToolbar
          {...toolbarProps}
          injectedAgents={injectedAgents}
          preferredAgent={preferredAgent}
          modelIconOnly={modelIconOnly}
        />

        <DropOverlay {...dropOverlayProps} />
      </div>

      <OtherSkillModal />

      <DocumentPickerModal />

      <div className={styles.footerTip}>AI 内容仅供参考，请仔细甄别</div>
    </div>
  );
}

function ChatInput(props: ChatInputProps) {
  return (
    <ChatInputStoreProvider>
      <ChatInputFileProvider getUploadSessionId={props.getUploadSessionId}>
        <ChatInputContent {...props} />
      </ChatInputFileProvider>
    </ChatInputStoreProvider>
  );
}

export default ChatInput;
