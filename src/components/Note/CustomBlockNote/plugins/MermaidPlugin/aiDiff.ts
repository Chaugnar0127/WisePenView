import i18n from '@/i18n';
import type { NoteBlockAiDiff } from '../../registry/types';
import styles from './MermaidBlock/style.module.less';
import { renderNoteMermaidDiagram } from './mermaidRuntime';
import { readMermaidSource } from './source';

let nextDiagramId = 1;

function isMermaidContent(value: unknown): value is string | unknown[] {
  return typeof value === 'string' || Array.isArray(value);
}

type MermaidDiffView = 'graph' | 'source';

function createSourcePanel(source: string, className: string): HTMLElement {
  const panel = document.createElement('pre');
  panel.className = className;
  const code = document.createElement('code');
  code.textContent = source;
  panel.appendChild(code);
  return panel;
}

function createViewButton(view: MermaidDiffView): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = styles.aiDiffViewButton;
  button.textContent = i18n.t(`mermaid.${view}`, { ns: 'note' });
  button.setAttribute('aria-pressed', 'false');
  return button;
}

function createMermaidDiffPanel(source: string, toneClassName: string): HTMLElement {
  const panel = document.createElement('section');
  panel.className = `${styles.aiDiffPanel} ${toneClassName}`;
  panel.contentEditable = 'false';
  panel.dataset.readOnly = 'true';

  const sourceButton = createViewButton('source');
  const graphButton = createViewButton('graph');
  const tabs = document.createElement('div');
  tabs.className = styles.aiDiffViewTabs;
  tabs.append(sourceButton, graphButton);

  const header = document.createElement('div');
  header.className = styles.aiDiffHeader;
  header.appendChild(tabs);

  const preview = document.createElement('div');
  preview.className = styles.aiDiffPreview;
  preview.textContent = source.trim()
    ? i18n.t('mermaid.rendering', { ns: 'note' })
    : i18n.t('mermaid.empty', { ns: 'note' });
  const sourcePanel = createSourcePanel(source, styles.aiDiffSource);
  const content = document.createElement('div');
  content.className = styles.aiDiffPanelContent;
  content.append(preview, sourcePanel);
  panel.append(header, content);

  const selectView = (view: MermaidDiffView) => {
    const showSource = view === 'source';
    sourcePanel.classList.toggle(styles.aiDiffPanelHidden, !showSource);
    preview.classList.toggle(styles.aiDiffPanelHidden, showSource);
    sourceButton.classList.toggle(styles.aiDiffViewButtonActive, showSource);
    graphButton.classList.toggle(styles.aiDiffViewButtonActive, !showSource);
    sourceButton.setAttribute('aria-pressed', String(showSource));
    graphButton.setAttribute('aria-pressed', String(!showSource));
  };
  const bindView = (button: HTMLButtonElement, view: MermaidDiffView) => {
    button.addEventListener('mousedown', (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      selectView(view);
    });
  };
  bindView(sourceButton, 'source');
  bindView(graphButton, 'graph');
  selectView('graph');

  if (source.trim()) {
    const diagramId = `ai-diff-mermaid-${nextDiagramId}`;
    nextDiagramId += 1;
    void renderNoteMermaidDiagram(diagramId, source)
      .then((svg) => {
        if (!preview.isConnected) return;
        preview.replaceChildren();
        const diagram = document.createElement('div');
        diagram.className = styles.aiDiffDiagram;
        diagram.innerHTML = svg;
        preview.appendChild(diagram);
      })
      .catch(() => {
        if (!preview.isConnected) return;
        preview.textContent = i18n.t('mermaid.renderFailed', { ns: 'note' });
        preview.classList.add(styles.aiDiffRenderError);
      });
  }

  return panel;
}

function renderMermaidAiContent(aiBlock: Record<string, unknown>): HTMLElement {
  return createMermaidDiffPanel(readMermaidSource(aiBlock.content), styles.aiDiffAdded);
}

/** Mermaid DSL 不适合逐词审阅，更新时以上旧下新的预览/源码面板对照。 */
export const mermaidBlockAiDiff: NoteBlockAiDiff = {
  resolve(block, aiContent) {
    if (!isMermaidContent(aiContent)) return null;

    const currentSource = readMermaidSource(block.content);
    const aiSource = readMermaidSource(aiContent);
    if (currentSource === aiSource) return null;
    return {
      current: block,
      aiBlock: { ...block, content: aiContent },
      currentEmpty: currentSource.length === 0,
      aiContentEmpty: aiSource.length === 0,
      changeKind:
        currentSource.length === 0 ? 'create' : aiSource.length === 0 ? 'delete' : 'update',
    };
  },
  acceptAiContent(_block, aiContent) {
    return isMermaidContent(aiContent) ? { content: aiContent } : null;
  },
  renderAiContent: renderMermaidAiContent,
  comparison: {
    render(current, aiBlock) {
      const root = document.createElement('div');
      root.className = styles.aiDiffComparison;
      root.append(
        createMermaidDiffPanel(readMermaidSource(current.content), styles.aiDiffRemoved),
        createMermaidDiffPanel(readMermaidSource(aiBlock.content), styles.aiDiffAdded)
      );
      return root;
    },
  },
};
