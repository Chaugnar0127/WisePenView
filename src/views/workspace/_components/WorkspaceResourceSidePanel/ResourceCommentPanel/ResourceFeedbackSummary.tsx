import { formatReadCount } from '@/utils/format/formatNumber';
import { ToggleButton } from '@heroui/react';
import { Eye, ThumbsUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

interface ResourceFeedbackSummaryProps {
  readCount?: number | null;
  favoriteCount?: number | null;
  // TODO: rating 功能暂时下线；未来恢复评分展示时再打开 scoreAvg。
  // scoreAvg?: number | null;
  liked: boolean;
  likeCount: number;
  // TODO: rating 功能暂时下线；未来恢复评分提交时再打开 score。
  // score: number;
  likePending: boolean;
  // TODO: rating 功能暂时下线；未来恢复评分提交时再打开 ratePending。
  // ratePending: boolean;
  onLikeChange(liked: boolean): void;
  // TODO: rating 功能暂时下线；未来恢复评分提交时再打开 onRateChange。
  // onRateChange(score: number): void;
  favoriteAction: ReactNode;
}

function ResourceFeedbackSummary({
  readCount,
  favoriteCount,
  // scoreAvg,
  liked,
  likeCount,
  // score,
  likePending,
  // ratePending,
  onLikeChange,
  // onRateChange,
  favoriteAction,
}: ResourceFeedbackSummaryProps) {
  const { t } = useTranslation('resource');
  // TODO: rating 功能暂时下线；未来恢复评分展示时再打开平均分文案。
  // const scoreAvgText =
  //   scoreAvg != null && Number.isFinite(scoreAvg)
  //     ? t('comment.feedback.averageScore', { score: scoreAvg.toFixed(1) })
  //     : t('comment.feedback.noScore');

  return (
    <section className={styles.feedback} aria-label={t('comment.feedback.statsAria')}>
      <div className={styles.feedbackActions}>
        <div className={styles.feedbackButtonGroup}>
          <span className={styles.feedbackActionItem}>
            <span className={styles.feedbackReadonlyButton}>
              <Eye size={14} aria-hidden />
              <span>{t('comment.feedback.viewLabel')}</span>
            </span>
            <span className={styles.feedbackCount}>{formatReadCount(readCount)}</span>
          </span>
          <span className={styles.feedbackSeparator} aria-hidden />
          <span className={styles.feedbackActionItem}>
            {favoriteAction}
            <span className={styles.feedbackCount}>{formatReadCount(favoriteCount)}</span>
          </span>
          <span className={styles.feedbackSeparator} aria-hidden />
          <span className={styles.feedbackActionItem}>
            <ToggleButton
              variant="ghost"
              size="sm"
              isSelected={liked}
              isDisabled={likePending}
              className={styles.helpfulButton}
              onChange={onLikeChange}
            >
              <ThumbsUp size={14} aria-hidden fill={liked ? 'currentColor' : 'none'} />
              <span>{t('comment.feedback.likeLabel')}</span>
            </ToggleButton>
            <span className={styles.feedbackCount}>{formatReadCount(likeCount)}</span>
          </span>
        </div>
        {/* TODO: rating 功能暂时下线；未来恢复评分展示时再打开平均分统计。 */}
        {/* <span className={styles.feedbackInfoItem}>
          <Star size={14} aria-hidden />
          <span>{scoreAvgText}</span>
        </span> */}
        {/* TODO: rating 功能暂时下线；未来恢复评分提交时再打开打星组件。 */}
        {/* <Rating
            value={score}
            size="sm"
            isDisabled={ratePending}
            ariaLabel={t('comment.feedback.ratingAria')}
            onValueChange={onRateChange}
        /> */}
      </div>
    </section>
  );
}

export default ResourceFeedbackSummary;
