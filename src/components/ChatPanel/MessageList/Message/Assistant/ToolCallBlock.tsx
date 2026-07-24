import { useMessageScroller } from '@/components/_shadcn';
import { useEffectForce } from '@/hooks/useEffectForce';
import { Button, Chip } from '@heroui/react';
import { getToolName, type DynamicToolUIPart, type ToolUIPart } from 'ai';
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleX,
  Clock,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';
import styles from './ToolCallBlock.module.less';

type RenderableToolPart = ToolUIPart | DynamicToolUIPart;
type ToolPartState = RenderableToolPart['state'];

type ToolDetailKind = 'input' | 'output' | 'error';

type ToolStatusTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';

interface ToolStatusBadge {
  label: string;
  tone: ToolStatusTone;
  Icon: LucideIcon;
}

interface ToolDetailSection {
  kind: ToolDetailKind;
  label: string;
  text: string;
}

interface ToolCallBlockProps {
  part: RenderableToolPart;
  /** 结束后是否自动收起，默认 true；运行中始终自动展开 */
  autoCollapseOnFinish?: boolean;
}

const STATUS_ICON_SIZE = 12;

const RUNNING_STATES: ReadonlySet<ToolPartState> = new Set([
  'input-streaming',
  'input-available',
  'approval-requested',
  'approval-responded',
]);

const FINISHED_STATES: ReadonlySet<ToolPartState> = new Set([
  'output-available',
  'output-error',
  'output-denied',
]);

/** 对齐 AI Elements Tool getStatusBadge 的状态文案与色调 */
function getToolStatusBadge(part: RenderableToolPart): ToolStatusBadge {
  switch (part.state) {
    case 'input-streaming':
      return { label: '待处理', tone: 'default', Icon: Circle };
    case 'input-available':
      return { label: '运行中', tone: 'default', Icon: Clock };
    case 'approval-requested':
      return { label: '等待批准', tone: 'warning', Icon: Clock };
    case 'approval-responded':
      return { label: '已回复', tone: 'accent', Icon: CheckCircle2 };
    case 'output-available':
      return { label: '已完成', tone: 'success', Icon: CheckCircle2 };
    case 'output-error':
      return { label: '错误', tone: 'danger', Icon: CircleX };
    case 'output-denied':
      return { label: '已拒绝', tone: 'danger', Icon: CircleX };
  }
}

function formatToolPayload(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getToolDetailSections(part: RenderableToolPart): ToolDetailSection[] {
  const sections: ToolDetailSection[] = [];

  if (part.input !== undefined) {
    sections.push({ kind: 'input', label: '输入', text: formatToolPayload(part.input) });
  }

  if (part.state === 'output-available') {
    sections.push({ kind: 'output', label: '输出', text: formatToolPayload(part.output) });
  }

  if (part.state === 'output-error') {
    sections.push({ kind: 'error', label: '错误', text: part.errorText || '调用失败' });
  }

  return sections;
}

function ToolStatusChip({ badge }: { badge: ToolStatusBadge }) {
  const { Icon, label, tone } = badge;
  return (
    <Chip size="sm" variant="soft" color={tone} className={styles.statusChip}>
      <Icon size={STATUS_ICON_SIZE} aria-hidden="true" className={styles.statusChipIcon} />
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

function ToolCallBlock({ part, autoCollapseOnFinish = true }: ToolCallBlockProps) {
  const badge = getToolStatusBadge(part);
  const isRunning = RUNNING_STATES.has(part.state);
  const [userExpanded, setUserExpanded] = useState(isRunning);
  const previousStateRef = useRef<ToolPartState | null>(null);
  const { scrollToEndUnlessUserInterrupted } = useMessageScroller();
  const detailSections = getToolDetailSections(part);
  const toolName = getToolName(part);
  const isExpanded = isRunning || userExpanded;
  const panelId = useId();

  useEffectForce(() => {
    const prev = previousStateRef.current;
    const stateChanged = prev !== part.state;
    previousStateRef.current = part.state;

    if (!stateChanged) return;

    if (RUNNING_STATES.has(part.state)) {
      const wasRunning = prev != null && RUNNING_STATES.has(prev);
      setUserExpanded(true);
      if (!wasRunning) scrollToEndUnlessUserInterrupted();
      return;
    }

    if (prev != null && FINISHED_STATES.has(part.state) && autoCollapseOnFinish) {
      setUserExpanded(false);
      scrollToEndUnlessUserInterrupted();
    }
  }, [part.state, autoCollapseOnFinish, scrollToEndUnlessUserInterrupted]);

  return (
    <div className={styles.wrapper}>
      <Button
        variant="ghost"
        className={styles.trigger}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onPress={() => {
          if (!isRunning) setUserExpanded((prev) => !prev);
        }}
      >
        <span className={styles.headerMain}>
          <Wrench size={14} aria-hidden="true" className={styles.toolIcon} />
          <span className={styles.toolName}>{toolName}</span>
        </span>
        <span className={styles.headerEnd}>
          <ToolStatusChip badge={badge} />
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={styles.indicator}
            data-expanded={isExpanded ? 'true' : 'false'}
          />
        </span>
      </Button>

      {isExpanded ? (
        <div id={panelId} className={styles.panel}>
          {detailSections.length === 0 ? (
            <p className={styles.empty}>暂无详情</p>
          ) : (
            detailSections.map((section) => (
              <section key={section.kind} className={styles.section}>
                <h4 className={styles.sectionLabel}>{section.label}</h4>
                <pre className={section.kind === 'error' ? styles.errorText : styles.payload}>
                  {section.text}
                </pre>
              </section>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default ToolCallBlock;
