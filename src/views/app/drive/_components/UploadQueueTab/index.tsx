import { useDriveUploadQueueStore } from '@/components/Drive/_store/useDriveUploadQueueStore';
import { DataTable, type DataTableColumn } from '@/components/Table';
import { useDocumentService } from '@/domains';
import type { PendingDocItem } from '@/domains/Document';
import { DOCUMENT_PROCESS, isDocumentTerminalStatus } from '@/domains/Document';
import { parseErrorMessage } from '@/utils/error';
import { formatFileSize } from '@/utils/format/formatFileSize';
import { Button, ProgressBar, toast } from '@heroui/react';
import { useInterval, useMount, useRequest, useUnmount } from 'ahooks';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';
import {
  buildUploadQueueRows,
  formatFileType,
  isActiveLocalUpload,
  mapCompletedPendingItemToRow,
  type UploadQueueRow,
} from './uploadQueueModel';

const REFRESH_INTERVAL_MS = 5000;
const COMPLETED_ROW_VISIBLE_DELAY_MS = 1500;

function UploadQueueTab() {
  const { t } = useTranslation(['drive', 'common']);
  const documentService = useDocumentService();
  const localUploads = useDriveUploadQueueStore((state) => state.uploads);
  const completedRowKeysRef = useRef<Set<string>>(new Set());
  const [pendingItems, setPendingItems] = useState<PendingDocItem[]>([]);
  const [completedRows, setCompletedRows] = useState<UploadQueueRow[]>([]);
  const [pollingActive, setPollingActive] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const hasActiveLocalUploads = localUploads.some(isActiveLocalUpload);

  const enqueueCompletedRows = (rows: UploadQueueRow[]) => {
    const freshRows = rows.filter((row) => {
      if (completedRowKeysRef.current.has(row.queueRowKey)) return false;
      completedRowKeysRef.current.add(row.queueRowKey);
      return true;
    });
    if (freshRows.length === 0) return;

    setCompletedRows((prev) => [...prev, ...freshRows]);
    const rowKeys = new Set(freshRows.map((row) => row.queueRowKey));
    window.setTimeout(() => {
      setCompletedRows((prev) => prev.filter((row) => !rowKeys.has(row.queueRowKey)));
    }, COMPLETED_ROW_VISIBLE_DELAY_MS);
  };

  const {
    run: runFetchPendingList,
    loading: listLoading,
    cancel: cancelPolling,
  } = useRequest(async () => documentService.listPendingDocs(), {
    manual: true,
    onSuccess: (nextItems) => {
      const readyRows = nextItems.flatMap((item, index) =>
        item.documentStatus.status === DOCUMENT_PROCESS.READY
          ? [mapCompletedPendingItemToRow(item, index, t)]
          : []
      );
      const nextPendingItems = nextItems.filter(
        (item) => item.documentStatus.status !== DOCUMENT_PROCESS.READY
      );

      setPendingItems(nextPendingItems);
      if (readyRows.length > 0) {
        removeMatchingLocalUploads(readyRows);
        enqueueCompletedRows(readyRows);
      }
      setPollingActive(
        nextPendingItems.some((item) => !isDocumentTerminalStatus(item.documentStatus.status))
      );
    },
    onError: (err) => {
      setPollingActive(false);
      toast.danger(parseErrorMessage(err));
    },
  });

  const { run: runRetryPendingDoc } = useRequest(
    async (documentId: string) => {
      await documentService.retryPendingDoc(documentId);
    },
    {
      manual: true,
      onBefore: ([documentId]) => {
        setRetryingId(documentId ?? null);
      },
      onSuccess: () => {
        toast.success(t('uploadQueue.feedback.retrySubmitted'));
        runFetchPendingList();
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
      onFinally: () => {
        setRetryingId(null);
      },
    }
  );

  const { run: runCancelPendingDoc } = useRequest(
    async (documentId: string) => {
      await documentService.cancelPendingDoc(documentId);
    },
    {
      manual: true,
      onBefore: ([documentId]) => {
        setCancelingId(documentId ?? null);
      },
      onSuccess: () => {
        toast.success(t('uploadQueue.feedback.canceled'));
        runFetchPendingList();
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
      onFinally: () => {
        setCancelingId(null);
      },
    }
  );

  useMount(() => {
    runFetchPendingList();
  });

  useInterval(
    () => {
      if (!listLoading) {
        runFetchPendingList();
      }
    },
    pollingActive || hasActiveLocalUploads ? REFRESH_INTERVAL_MS : undefined
  );

  useUnmount(() => {
    cancelPolling();
  });

  const items = buildUploadQueueRows(localUploads, pendingItems, completedRows, t);

  const columns = [
    {
      id: 'filename',
      label: t('uploadQueue.columns.filename'),
      width: 'fill',
      isRowHeader: true,
      renderCell: (row) => (
        <span className={styles.nameText}>{row.documentName || t('node.unnamedDocument')}</span>
      ),
    },
    {
      id: 'fileType',
      label: t('uploadQueue.columns.type'),
      width: 'sm',
      renderCell: (row) => formatFileType(row.fileType),
    },
    {
      id: 'size',
      label: t('uploadQueue.columns.size'),
      width: 'sm',
      renderCell: (row) => formatFileSize(row.size),
    },
    {
      id: 'progress',
      label: t('uploadQueue.columns.progress'),
      width: 'lg',
      renderCell: (row) => <UploadProgressCell row={row} />,
    },
    {
      id: 'action',
      label: '',
      width: 'md',
      align: 'end',
      renderCell: (row) => {
        if (!row.retryable && !row.cancelable) return null;
        return (
          <div className={styles.actionGroup}>
            {row.retryable ? (
              <Button
                variant="ghost"
                size="sm"
                isDisabled={retryingId === row.documentId}
                onPress={() => {
                  if (row.documentId) runRetryPendingDoc(row.documentId);
                }}
              >
                {t('actions.retry', { ns: 'common' })}
              </Button>
            ) : null}
            {row.cancelable ? (
              <Button
                variant="danger"
                size="sm"
                isDisabled={cancelingId === row.documentId}
                onPress={() => {
                  if (row.documentId) runCancelPendingDoc(row.documentId);
                }}
              >
                {t('actions.cancel', { ns: 'common' })}
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ] satisfies DataTableColumn<UploadQueueRow>[];

  return (
    <div className={styles.wrapper}>
      <main className={styles.listArea}>
        <DataTable<UploadQueueRow>
          ariaLabel={t('uploadQueue.aria')}
          rowKey="queueRowKey"
          items={items}
          columns={columns}
          loading={listLoading}
          emptyText={t('uploadQueue.empty')}
          summary={false}
        />
      </main>
    </div>
  );
}

function UploadProgressCell({ row }: { row: UploadQueueRow }) {
  const { t } = useTranslation('drive');
  const { presentation } = row;

  if (presentation.kind === 'done') {
    return (
      <div className={styles.statusLine} role="status">
        <span className={styles.progressLabel}>{presentation.label}</span>
        <CircleCheck className={styles.doneIcon} aria-hidden="true" size={17} strokeWidth={2} />
      </div>
    );
  }

  if (presentation.kind === 'error') {
    return (
      <div className={styles.statusLine}>
        <span className={styles.errorLabel} title={presentation.label}>
          {presentation.label}
        </span>
        <CircleAlert className={styles.errorIcon} aria-hidden="true" size={17} strokeWidth={2} />
      </div>
    );
  }

  const isLoading = presentation.kind === 'loading';

  return (
    <div className={styles.progressCell} aria-busy={isLoading || undefined}>
      <div className={styles.progressMeta}>
        <span className={styles.progressLabel} title={presentation.label}>
          {presentation.label}
        </span>
        {presentation.kind === 'progress' ? (
          <span className={styles.progressValue}>{presentation.progress}%</span>
        ) : null}
      </div>
      <ProgressBar
        aria-label={t('uploadQueue.status.progressAria', {
          name: row.documentName || t('node.unnamedDocument'),
          status: presentation.label,
        })}
        color="accent"
        isIndeterminate={isLoading}
        size="sm"
        value={presentation.kind === 'progress' ? presentation.progress : undefined}
      >
        <ProgressBar.Track className={styles.progressTrack}>
          <ProgressBar.Fill className={styles.progressFill} />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}

function removeMatchingLocalUploads(rows: UploadQueueRow[]): void {
  const completedDocumentIds = new Set(
    rows.flatMap((row) => (row.documentId ? [row.documentId] : []))
  );
  if (completedDocumentIds.size === 0) return;

  const { uploads, removeUpload } = useDriveUploadQueueStore.getState();
  uploads.forEach((upload) => {
    if (upload.documentId && completedDocumentIds.has(upload.documentId)) {
      removeUpload(upload.id);
    }
  });
}

export default UploadQueueTab;
