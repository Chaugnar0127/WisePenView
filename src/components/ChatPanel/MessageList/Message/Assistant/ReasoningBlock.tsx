import { useMessageScroller } from '@/components/_shadcn';
import { useEffectForce } from '@/hooks/useEffectForce';
import { Button } from '@heroui/react';
import { Brain, ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import styles from './ReasoningBlock.module.less';
import { useCollapseHeight } from './useCollapseHeight';

interface ReasoningBlockProps {
  content: string;
  loading: boolean;
  durationSeconds?: number;
  /** 流式结束后是否自动收起，默认 true */
  autoCollapseOnFinish?: boolean;
}

function formatReasoningLabel(loading: boolean, durationSeconds?: number): string {
  if (loading) return '思考中...';
  if (durationSeconds != null && durationSeconds >= 0) {
    return `思考了 ${durationSeconds} 秒`;
  }
  return '思考过程';
}

function ReasoningBlock({
  content,
  loading,
  durationSeconds,
  autoCollapseOnFinish = true,
}: ReasoningBlockProps) {
  const [userExpanded, setUserExpanded] = useState(loading);
  const [localDurationSeconds, setLocalDurationSeconds] = useState<number | undefined>(
    durationSeconds
  );
  const previousLoadingRef = useRef(loading);
  const startedAtRef = useRef<number | null>(null);
  const { scrollToEndUnlessUserInterrupted } = useMessageScroller();
  const isExpanded = loading || userExpanded;
  const displayDuration = durationSeconds ?? localDurationSeconds;
  const collapseRef = useCollapseHeight(isExpanded);
  const panelId = useId();

  useEffectForce(() => {
    const wasLoading = previousLoadingRef.current;
    previousLoadingRef.current = loading;

    if (loading) {
      if (startedAtRef.current == null) startedAtRef.current = Date.now();
      setUserExpanded(true);
      return;
    }

    if (wasLoading && !loading) {
      if (startedAtRef.current != null) {
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        setLocalDurationSeconds(elapsedSeconds);
        startedAtRef.current = null;
      }
      if (autoCollapseOnFinish) {
        setUserExpanded(false);
      }
      scrollToEndUnlessUserInterrupted();
    }
  }, [loading, autoCollapseOnFinish, scrollToEndUnlessUserInterrupted]);

  if (!content && !loading) return null;

  return (
    <div className={styles.wrapper}>
      <Button
        variant="ghost"
        size="sm"
        className={styles.header}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onPress={() => {
          if (!loading) setUserExpanded((prev) => !prev);
        }}
      >
        <Brain
          className={loading ? styles.brainIconPulse : styles.brainIcon}
          aria-hidden="true"
          size={14}
        />
        <span className={loading ? styles.shimmerLabel : undefined}>
          {formatReasoningLabel(loading, displayDuration)}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={styles.indicator}
          data-expanded={isExpanded ? 'true' : 'false'}
        />
      </Button>

      <div ref={collapseRef} id={panelId} className={styles.collapse} aria-hidden={!isExpanded}>
        <blockquote className={styles.content}>{content}</blockquote>
      </div>
    </div>
  );
}

export default ReasoningBlock;
