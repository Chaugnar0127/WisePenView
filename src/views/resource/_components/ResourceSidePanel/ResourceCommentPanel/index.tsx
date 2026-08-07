import AppAlertDialog from '@/components/Overlay/AppAlertDialog';
import AppDisplayDialog from '@/components/Overlay/AppDisplayDialog';
import { useInteractService, useUserService } from '@/domains';
import type { CommentSortBy, ResourceComment } from '@/domains/Interact';
import type { ResourceItem } from '@/domains/Resource';
import { parseErrorMessage } from '@/utils/error';
import { Button, Tabs, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState, type Key } from 'react';
import { useTranslation } from 'react-i18next';
import ResourceFavoriteAction from '../../ResourceFavoriteAction';
import CommentComposer from './CommentComposer';
import ResourceCommentThread from './ResourceCommentThread';
import ResourceFeedbackSummary from './ResourceFeedbackSummary';
import styles from './style.module.less';
import { updateCommentLikeCount } from './utils';

const COMMENT_PAGE_SIZE = 10;
const EMPTY_LIKED_COMMENT_IDS = new Set<string>();

interface ResourceCommentPanelProps {
  resource: ResourceItem;
  onResourceChanged?: () => unknown | Promise<unknown>;
}

interface OptimisticLikeState {
  resourceId: string;
  baseCount: number;
  count: number;
  liked: boolean;
}

interface PendingDeletion {
  comment: ResourceComment;
  onDeleted?: () => void | Promise<void>;
}

function ResourceCommentPanel({ resource, onResourceChanged }: ResourceCommentPanelProps) {
  const { t } = useTranslation(['resource', 'common']);
  const interactService = useInteractService();
  const userService = useUserService();
  const resourceId = resource.resourceId;
  const resourceLikeCount = resource.likeCount ?? 0;
  const [optimisticLike, setOptimisticLike] = useState<OptimisticLikeState>();
  const [commentLikeIds, setCommentLikeIds] = useState<ReadonlySet<string>>();
  const [pendingLikeIds, setPendingLikeIds] = useState<ReadonlySet<string>>(new Set());
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [sortBy, setSortBy] = useState<CommentSortBy>('CREATE_TIME');
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion>();
  const [previewImageUrl, setPreviewImageUrl] = useState<string>();

  const { data: currentUser } = useRequest(() => userService.getUserInfo());
  const {
    data: interaction,
    loading: interactionLoading,
    refresh: refreshInteraction,
  } = useRequest(() => interactService.getResourceInteraction(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
  });

  const notifyResourceChanged = () => {
    void Promise.resolve(onResourceChanged?.())
      .catch((error) => toast.danger(parseErrorMessage(error)))
      .finally(refreshInteraction);
  };

  const { run: submitResourceLike, loading: resourceLikePending } = useRequest(
    async (liked: boolean) => {
      await interactService.setResourceLike(resourceId, liked);
      return liked;
    },
    {
      manual: true,
      onSuccess: notifyResourceChanged,
      onError: (error) => {
        setOptimisticLike(undefined);
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const {
    data: commentPageData,
    error: commentsError,
    loading: commentsLoading,
    runAsync: loadComments,
  } = useRequest(
    async (page: number, append: boolean, nextSortBy: CommentSortBy) => {
      const data = await interactService.listComments({
        resourceId,
        sortBy: nextSortBy,
        page,
        size: COMMENT_PAGE_SIZE,
      });
      setComments((current) => (append ? [...current, ...data.items] : data.items));
      setCommentPage(page);
      return data;
    },
    {
      defaultParams: [1, false, 'CREATE_TIME'],
      refreshDeps: [resourceId],
    }
  );

  const refreshComments = async () => {
    await loadComments(1, false, sortBy);
    notifyResourceChanged();
  };

  const likedCommentIds = commentLikeIds ?? interaction?.likedCommentIds ?? EMPTY_LIKED_COMMENT_IDS;

  const toggleCommentLike = async (comment: ResourceComment): Promise<boolean> => {
    const wasLiked = likedCommentIds.has(comment.commentId);
    if (pendingLikeIds.has(comment.commentId)) return wasLiked;

    setPendingLikeIds((current) => new Set(current).add(comment.commentId));
    try {
      const liked = await interactService.toggleCommentLike({
        resourceId,
        commentId: comment.commentId,
      });
      setCommentLikeIds((current) => {
        const next = new Set(current ?? likedCommentIds);
        if (liked) next.add(comment.commentId);
        else next.delete(comment.commentId);
        return next;
      });
      if (liked !== wasLiked) {
        setComments((current) => updateCommentLikeCount(current, comment.commentId, liked));
      }
      return liked;
    } catch (error) {
      toast.danger(parseErrorMessage(error));
      return wasLiked;
    } finally {
      setPendingLikeIds((current) => {
        const next = new Set(current);
        next.delete(comment.commentId);
        return next;
      });
    }
  };

  const { run: confirmDelete, loading: deleting } = useRequest(
    async () => {
      const target = pendingDeletion;
      if (!target) return;

      await interactService.deleteComment({
        resourceId,
        commentId: target.comment.commentId,
      });
      await target.onDeleted?.();
      setPendingDeletion(undefined);
      await refreshComments();
    },
    {
      manual: true,
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );

  const activeOptimisticLike =
    optimisticLike?.resourceId === resourceId && optimisticLike.baseCount === resourceLikeCount
      ? optimisticLike
      : undefined;
  const hasMoreComments = Boolean(commentPageData && commentPage < commentPageData.totalPage);
  const commentSortOptions: Array<{ key: CommentSortBy; label: string }> = [
    { key: 'CREATE_TIME', label: t('resource:comment.sort.latest') },
    { key: 'LIKE_COUNT', label: t('resource:comment.sort.hottest') },
  ];

  const handleResourceLikeChange = (liked: boolean) => {
    const currentCount = activeOptimisticLike?.count ?? resourceLikeCount;
    setOptimisticLike({
      resourceId,
      baseCount: resourceLikeCount,
      count: Math.max(0, currentCount + (liked ? 1 : -1)),
      liked,
    });
    submitResourceLike(liked);
  };

  const handleSortChange = (nextSortBy: CommentSortBy) => {
    setSortBy(nextSortBy);
    void loadComments(1, false, nextSortBy);
  };

  const handleSortSelectionChange = (key: Key) => {
    const nextSortBy = String(key);
    if (nextSortBy === 'CREATE_TIME' || nextSortBy === 'LIKE_COUNT') {
      handleSortChange(nextSortBy);
    }
  };

  return (
    <div className={styles.panel}>
      <header className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{t('resource:sidePanel.comments')}</h2>
      </header>

      <div className={styles.content}>
        <section
          className={styles.commentsSection}
          aria-label={t('resource:sidePanel.commentsAria')}
        >
          <div className={styles.commentsHeader}>
            <Tabs
              variant="secondary"
              selectedKey={sortBy}
              onSelectionChange={handleSortSelectionChange}
              className={styles.commentSortTabs}
            >
              <Tabs.ListContainer>
                <Tabs.List
                  className={styles.commentSortTabsList}
                  aria-label={t('resource:comment.sortAria')}
                >
                  {commentSortOptions.map((option) => (
                    <Tabs.Tab key={option.key} id={option.key} className={styles.commentSortTab}>
                      {option.label}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
            <ResourceFeedbackSummary
              readCount={resource.readCount}
              favoriteCount={resource.favoriteCount}
              liked={activeOptimisticLike?.liked ?? interaction?.liked ?? false}
              likeCount={activeOptimisticLike?.count ?? resourceLikeCount}
              likePending={interactionLoading || resourceLikePending || !interaction}
              onLikeChange={handleResourceLikeChange}
              favoriteAction={
                <ResourceFavoriteAction resourceId={resourceId} onSuccess={onResourceChanged} />
              }
            />
          </div>

          {commentsError ? (
            <p className={styles.errorText}>{parseErrorMessage(commentsError)}</p>
          ) : null}
          {commentsLoading && comments.length === 0 ? (
            <p className={styles.mutedText}>{t('resource:comment.loading')}</p>
          ) : null}
          {!commentsLoading && comments.length === 0 ? (
            <p className={styles.emptyText}>{t('resource:comment.empty')}</p>
          ) : null}

          <div className={styles.commentList}>
            {comments.map((comment) => (
              <ResourceCommentThread
                key={comment.commentId}
                resourceId={resourceId}
                rootComment={comment}
                currentUserId={currentUser?.id}
                resourceOwnerId={resource.ownerId}
                likedCommentIds={likedCommentIds}
                pendingLikeIds={pendingLikeIds}
                onLike={toggleCommentLike}
                onDelete={(target, onDeleted) => setPendingDeletion({ comment: target, onDeleted })}
                onCommentsChanged={refreshComments}
                onPreviewImage={setPreviewImageUrl}
              />
            ))}
          </div>

          {hasMoreComments ? (
            <Button
              variant="ghost"
              size="sm"
              className={styles.loadMoreButton}
              isDisabled={commentsLoading}
              onPress={() => void loadComments(commentPage + 1, true, sortBy)}
            >
              {commentsLoading
                ? t('resource:comment.loadingShort')
                : t('resource:comment.loadMore')}
            </Button>
          ) : null}
        </section>
      </div>

      <div className={styles.composerDock}>
        <CommentComposer
          placeholder={t('resource:comment.placeholder')}
          onSubmit={async (content, imageUrls) => {
            await interactService.createComment({ resourceId, content, imageUrls });
            await refreshComments();
          }}
        />
      </div>

      <AppAlertDialog
        type="danger"
        isOpen={Boolean(pendingDeletion)}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDeletion(undefined);
        }}
        title={t('resource:comment.deleteDialog.title')}
        description={t('resource:comment.deleteDialog.description')}
        confirmText={t('common:actions.delete')}
        isConfirmLoading={deleting}
        isConfirmDisabled={!pendingDeletion}
        onConfirm={confirmDelete}
      />

      <AppDisplayDialog
        isOpen={Boolean(previewImageUrl)}
        onOpenChange={(open) => {
          if (!open) setPreviewImageUrl(undefined);
        }}
        title={t('resource:comment.imageDialog.title')}
        size="lg"
      >
        {previewImageUrl ? (
          <img
            className={styles.previewImage}
            src={previewImageUrl}
            alt={t('resource:comment.imageDialog.previewAlt')}
          />
        ) : null}
      </AppDisplayDialog>
    </div>
  );
}

export default ResourceCommentPanel;
