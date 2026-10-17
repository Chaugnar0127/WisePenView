import {
  createExtension,
  createTableBlockSpec,
  type ExtensionFactoryInstance,
} from '@blocknote/core';

import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';

import { normalizeTableRowHeight, TABLE_ROW_HEIGHT_ATTRIBUTE } from './rowHeight';

const baseTableSpec = createTableBlockSpec();

type TableSpecExtensions = NonNullable<typeof baseTableSpec.extensions>;

/** 这里只依赖 BlockNote 暴露的节点最小形状，避免直接引用未声明的 @tiptap/core。 */
interface TiptapNodeLike {
  name: string;
  extend: (config: TableRowNodeConfig) => TiptapNodeLike;
}

interface RowRenderContext {
  node: { attrs: Record<string, unknown> };
  HTMLAttributes: Record<string, unknown>;
}

interface TableRowNodeConfig {
  addAttributes?: (this: {
    parent?: () => Record<string, unknown> | undefined;
  }) => Record<string, unknown>;
  renderHTML?: (context: RowRenderContext) => unknown;
}

interface TableExtensionDescriptor {
  key: string;
  tiptapExtensions?: readonly TiptapNodeLike[];
  [key: string]: unknown;
}

/** BlockNote 的 table spec 通过对象工厂暴露内部 Tiptap 节点，这里只读取并重建同一份描述。 */
function resolveTableExtensionDescriptor(
  factory: TableSpecExtensions[number]
): TableExtensionDescriptor | null {
  const resolved =
    typeof factory === 'function'
      ? (factory as unknown as () => unknown)()
      : (factory as unknown as unknown);
  if (!resolved || typeof resolved !== 'object') {
    return null;
  }
  return resolved as TableExtensionDescriptor;
}

function appendStyle(style: unknown, addition: string): string {
  return typeof style === 'string' && style.trim() ? `${style};${addition}` : addition;
}

function createResizableTableRowNode(rowNode: TiptapNodeLike): TiptapNodeLike {
  return rowNode.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        [TABLE_ROW_HEIGHT_ATTRIBUTE]: {
          default: null,
          parseHTML: (element: HTMLElement) =>
            normalizeTableRowHeight(Number(element.getAttribute('data-row-height'))),
          renderHTML: (attributes: Record<string, unknown>) => {
            const height = normalizeTableRowHeight(attributes[TABLE_ROW_HEIGHT_ATTRIBUTE]);
            return height === null ? {} : { 'data-row-height': String(height) };
          },
        },
      };
    },
    renderHTML({ node, HTMLAttributes }) {
      const height = normalizeTableRowHeight(node.attrs[TABLE_ROW_HEIGHT_ATTRIBUTE]);
      const { [TABLE_ROW_HEIGHT_ATTRIBUTE]: _height, ...attributes } = HTMLAttributes as Record<
        string,
        string | undefined
      >;
      if (height === null) {
        return ['tr', attributes, 0];
      }
      return [
        'tr',
        {
          ...attributes,
          // 行高通过变量交给样式表控制，避免行内 height 在拖拽收缩时成为最小值。
          style: appendStyle(attributes.style, `--note-table-row-height:${height}px`),
        },
        0,
      ];
    },
  });
}

function createNoteTableBlockSpec() {
  const extensions = baseTableSpec.extensions ?? [];
  const tableExtensionsIndex = extensions.findIndex((factory) => {
    const descriptor = resolveTableExtensionDescriptor(factory);
    return Boolean(descriptor?.tiptapExtensions?.some((node) => node.name === 'tableRow'));
  });
  if (tableExtensionsIndex === -1) {
    throw createClientError(FRONTEND_CLIENT_ERROR.INTERNAL_STATE, {
      reason: 'BlockNote table spec 缺少 tableRow 节点',
    });
  }

  const descriptor = resolveTableExtensionDescriptor(extensions[tableExtensionsIndex]);
  if (!descriptor?.tiptapExtensions?.some((node) => node.name === 'tableRow')) {
    throw createClientError(FRONTEND_CLIENT_ERROR.INTERNAL_STATE, {
      reason: 'BlockNote table spec 的 tableRow 节点无法扩展',
    });
  }

  const nextTableExtensions = createExtension({
    ...descriptor,
    tiptapExtensions: descriptor.tiptapExtensions.map((node) =>
      node.name === 'tableRow' ? createResizableTableRowNode(node) : node
    ),
  } as never) as unknown as ExtensionFactoryInstance;

  return {
    ...baseTableSpec,
    extensions: extensions.map((factory, index) =>
      index === tableExtensionsIndex ? nextTableExtensions : factory
    ),
  };
}

/** 在 BlockNote 原生 table spec 上增加行高属性，保留单元格 inline 编辑与协同能力。 */
export const noteTableBlockSpec = createNoteTableBlockSpec();
