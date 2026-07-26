import { buildApiUrl } from '@/apis/clientUrls';
import { useEffectForce } from '@/hooks/useEffectForce';
import { createClientError, FRONTEND_CLIENT_ERROR, isWisePenError } from '@/utils/error';
import { PDFViewer as EmbedPdfViewer } from '@embedpdf/react-pdf-viewer';
import { useMount, useUnmount } from 'ahooks';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PdfViewerProps } from './index.type';
import { DEFAULT_PDF_VIEWER_CONFIG } from './pdf.config';
import styles from './style.module.less';

interface DocumentManagerApi {
  openDocumentUrl(options: {
    url: string;
    documentId: string;
    mode?: string;
    requestOptions?: RequestInit;
    permissions?: Record<string, boolean>;
  }): Promise<void>;
  onDocumentError?(
    handler: (payload: { documentId?: string; error?: unknown }) => void
  ): (() => void) | void;
}

interface PdfI18nApi {
  setLocale(locale: string): void;
}

interface PdfPlugin<T> {
  provides(): T;
}

interface PdfViewerHandle {
  registry: Promise<{
    getPlugin(name: 'document-manager'): PdfPlugin<DocumentManagerApi> | undefined;
    getPlugin(name: 'i18n'): PdfPlugin<PdfI18nApi> | undefined;
    getPlugin(name: string): PdfPlugin<unknown> | undefined;
  }>;
}

function readConfigSection(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function createViewerConfig(
  config: Record<string, unknown> | undefined,
  locale: string
): Record<string, unknown> {
  const baseConfig = config ?? DEFAULT_PDF_VIEWER_CONFIG;
  const i18nConfig = readConfigSection(baseConfig.i18n);

  return {
    ...baseConfig,
    i18n: {
      ...i18nConfig,
      defaultLocale: locale,
      fallbackLocale: i18nConfig.fallbackLocale ?? 'en',
    },
  };
}

function PdfViewer({ resourceId, config, className, onLoadError }: PdfViewerProps) {
  const { i18n } = useTranslation();
  const pdfLocale = i18n.resolvedLanguage === 'en-US' ? 'en' : 'zh-CN';
  const viewerRef = useRef<PdfViewerHandle | null>(null);
  const onDocumentErrorCleanupRef = useRef<(() => void) | null>(null);
  // EmbedPDF 只在实例初始化时读取 config；用惰性状态保存该次初始化快照。
  const [viewerConfig] = useState(() => createViewerConfig(config, pdfLocale));

  const syncViewerLocale = async () => {
    if (!viewerRef.current) return;
    const registry = await viewerRef.current.registry;
    registry.getPlugin('i18n')?.provides().setLocale(pdfLocale);
  };

  const loadDocument = async () => {
    if (!resourceId || !viewerRef.current) return;

    try {
      const registry = await viewerRef.current.registry;
      const docManager = registry.getPlugin('document-manager')?.provides();
      if (!docManager) {
        const err = createClientError(FRONTEND_CLIENT_ERROR.PDF_MANAGER_UNAVAILABLE);
        onLoadError?.(err);
        return;
      }
      if (onDocumentErrorCleanupRef.current === null) {
        const cleanup = docManager.onDocumentError?.(({ error }) => {
          console.error('[PdfViewer] 文档事件错误:', error);
          onLoadError?.(
            isWisePenError(error)
              ? error
              : createClientError(FRONTEND_CLIENT_ERROR.DOCUMENT_LOAD_FAILED, undefined, error)
          );
        });
        if (typeof cleanup === 'function') {
          onDocumentErrorCleanupRef.current = cleanup;
        }
      }
      const documentId = `doc-${resourceId}`;
      await docManager?.openDocumentUrl({
        url: buildApiUrl(`/document/getDocPreview?resourceId=${encodeURIComponent(resourceId)}`),
        documentId,
        mode: 'range-request',
        requestOptions: {
          credentials: 'include',
        },
        permissions: {
          canPrint: false,
          canCopy: false,
        },
      });
    } catch (error) {
      console.error('[PdfViewer] 文档加载失败:', error);
      onLoadError?.(
        isWisePenError(error)
          ? error
          : createClientError(FRONTEND_CLIENT_ERROR.DOCUMENT_LOAD_FAILED, undefined, error)
      );
    }
  };

  useMount(() => {
    void loadDocument();
  });

  /**
   * 执行时机：应用语言变化后同步 PDF Viewer 的本地化配置。
   * 不可替代原因：第三方 Viewer 仅提供命令式语言 API，不能由 JSX 属性更新。
   * cleanup：没有订阅或延迟任务，无需清理。
   */
  useEffectForce(() => {
    void syncViewerLocale();
  }, [pdfLocale]);

  useUnmount(() => {
    if (onDocumentErrorCleanupRef.current) {
      onDocumentErrorCleanupRef.current();
      onDocumentErrorCleanupRef.current = null;
    }
  });

  return (
    <EmbedPdfViewer
      ref={viewerRef as React.RefObject<never>}
      config={viewerConfig}
      className={clsx(styles.viewer, className)}
    />
  );
}

export default PdfViewer;
