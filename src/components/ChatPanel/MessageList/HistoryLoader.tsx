import { Spin } from '@/components/Feedback';
import {
  Marker,
  MarkerContent,
  MarkerIcon,
  MessageScrollerItem,
  useMessageScrollerScrollable,
} from '@/components/_shadcn';
import markerStyles from '@/components/_shadcn/marker.module.less';
import { useLatest, useUpdateEffect } from 'ahooks';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

interface HistoryLoaderProps {
  canLoadMoreHistory: boolean;
  loadingMoreHistory: boolean;
  onLoadMoreHistory: () => Promise<void>;
}

function HistoryLoader({
  canLoadMoreHistory,
  loadingMoreHistory,
  onLoadMoreHistory,
}: HistoryLoaderProps) {
  const { t } = useTranslation('chat');
  const { start } = useMessageScrollerScrollable();
  const loadMoreRef = useLatest(onLoadMoreHistory);
  const pendingRef = useRef(false);

  useUpdateEffect(() => {
    if (start || !canLoadMoreHistory || loadingMoreHistory || pendingRef.current) return;

    pendingRef.current = true;
    void loadMoreRef.current().finally(() => {
      pendingRef.current = false;
    });
  }, [canLoadMoreHistory, loadingMoreHistory, start]);

  if (!loadingMoreHistory) return null;

  return (
    <MessageScrollerItem className={styles.loadMoreWrapper}>
      <Marker variant="separator" role="status">
        <MarkerIcon>
          <Spin size="small" />
        </MarkerIcon>
        <MarkerContent className={markerStyles.shimmer}>
          {t('message.historyLoading')}
        </MarkerContent>
      </Marker>
    </MessageScrollerItem>
  );
}

export default HistoryLoader;
