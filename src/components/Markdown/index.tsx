import { useEffectForce } from '@/hooks/useEffectForce';
import { useState } from 'react';
import MarkdownRenderer, { type MarkdownResourceResolver } from './Renderer';
import { createMarkdownRuntime, updateMarkdownRuntime } from './runtime';
import styles from './style.module.less';

export type { MarkdownResourceResolver } from './Renderer';

interface MarkdownContentProps {
  content: string;
  streaming?: boolean;
  linkMode?: 'external' | 'safe';
  resourceResolver?: MarkdownResourceResolver;
}

function Markdown({
  content,
  streaming = false,
  linkMode = 'safe',
  resourceResolver,
}: MarkdownContentProps) {
  const [runtime] = useState(() => createMarkdownRuntime(content, streaming));
  const [snapshot, setSnapshot] = useState(runtime.snapshot);

  /**
   * 执行时机：Markdown 内容或流式状态变化后推进增量解析运行时。
   * 不可替代原因：runtime 是组件外部的可变解析器，需要按输入变化执行增量更新命令。
   * cleanup：解析器没有订阅或异步任务，无需清理。
   */
  useEffectForce(() => {
    const nextSnapshot = updateMarkdownRuntime(runtime, content, streaming);
    if (nextSnapshot) setSnapshot(nextSnapshot);
  }, [content, streaming]);

  return (
    <div className={styles.markdown}>
      <MarkdownRenderer
        blocks={snapshot.blocks}
        renderContext={snapshot.renderContext}
        showFootnotes={!streaming}
        streaming={streaming}
        linkMode={linkMode}
        resourceResolver={resourceResolver}
      />
    </div>
  );
}

export default Markdown;
