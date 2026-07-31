export interface InlineCommentUserDisplayApiResponse {
  nickname?: string | null;
  realName?: string | null;
  avatar?: string | null;
  identityType?: string | null;
}

export interface InlineCommentAnchorRefApiResponse {
  externalAnchorId?: string | null;
  quoteText?: string | null;
  anchorPayload?: Record<string, unknown> | null;
}

export interface InlineCommentReactionApiResponse {
  emojiId?: string | null;
  createTime?: number | null;
}

export interface InlineCommentReactionGroupApiResponse {
  emojiId?: string | null;
  count?: number | null;
  reactedByCurrentUser?: boolean | null;
  users?: Array<InlineCommentUserDisplayApiResponse | null> | null;
}

export interface InlineCommentItemApiResponse {
  itemId?: string | null;
  authorId?: string | null;
  authorInfo?: InlineCommentUserDisplayApiResponse | null;
  content?: string | null;
  imageUrls?: string[] | null;
  mentionUserIds?: string[] | null;
  reactions?: Record<
    string,
    InlineCommentReactionApiResponse | InlineCommentReactionApiResponse[] | null | undefined
  > | null;
  reactionGroups?: InlineCommentReactionGroupApiResponse[] | null;
  createTime?: number | null;
  updateTime?: number | null;
}

export interface InlineCommentApiResponse {
  inlineCommentId?: string | null;
  resourceId?: string | null;
  applicableFromVersion?: number | null;
  applicableToVersion?: number | null;
  creatorId?: string | null;
  creatorInfo?: InlineCommentUserDisplayApiResponse | null;
  anchorRef?: InlineCommentAnchorRefApiResponse | null;
  items?: InlineCommentItemApiResponse[] | null;
  resolved?: boolean | null;
  resolvedBy?: string | null;
  resolvedByInfo?: InlineCommentUserDisplayApiResponse | null;
  resolvedAt?: number | null;
  createTime?: number | null;
  updateTime?: number | null;
}

export interface ListInlineCommentsApiRequest {
  resourceId: string;
  contentVersion?: number;
  resolved?: boolean;
}

export type ListInlineCommentsApiResponse = InlineCommentApiResponse[];

export interface CreateInlineCommentApiRequest {
  resourceId: string;
  externalAnchorId: string;
  quoteText?: string;
  anchorPayload?: Record<string, unknown>;
  contentVersion?: number;
  applicableFromVersion?: number;
  applicableToVersion?: number;
  content: string;
  imageUrls?: string[];
  mentionUserIds?: string[];
}

export interface AddInlineCommentItemApiRequest {
  resourceId: string;
  inlineCommentId: string;
  contentVersion?: number;
  content: string;
  imageUrls?: string[];
  mentionUserIds?: string[];
}

export interface UpdateInlineCommentItemApiRequest extends AddInlineCommentItemApiRequest {
  itemId: string;
}

export interface SetInlineCommentItemReactionApiRequest {
  resourceId: string;
  inlineCommentId: string;
  itemId: string;
  contentVersion?: number;
  emojiId: string;
}

export interface DeleteInlineCommentItemReactionApiRequest {
  resourceId: string;
  inlineCommentId: string;
  itemId: string;
  contentVersion?: number;
  emojiId?: string;
}

export interface DeleteInlineCommentItemApiRequest {
  resourceId: string;
  inlineCommentId: string;
  itemId: string;
}

export interface ChangeInlineCommentResolveStatusApiRequest {
  resourceId: string;
  inlineCommentId: string;
  resolved: boolean;
  contentVersion?: number;
}
