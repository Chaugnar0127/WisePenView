import type { NumericEnumApiValue } from '@/apis/api.type';

type TagAccessControlScopeApiValue = 0 | 1 | 2 | 3;
type TagResourceActionApiKey =
  | 'DISCOVER'
  | 'VIEW'
  | 'LOAD'
  | 'EDIT'
  | 'INLINE_COMMENT'
  | 'DOWNLOAD_WATERMARK'
  | 'DOWNLOAD_ORIGINAL'
  | 'FORK'
  | 'COMMENT';

export interface AddTagApiRequest {
  groupId?: string;
  parentId?: string;
  tagName: string;
  tagDesc?: string;
  tagIcon?: string;
  tagColor?: string;
  tagMetaInfo?: string;
  tagCreator?: string;
  isPath?: boolean;
  visibilityMode?: string;
  taggedResourceAclGrantScope?: TagAccessControlScopeApiValue;
  taggedResourceAclGrantSpecifiedUsers?: string[];
  tagMountPermissionScope?: TagAccessControlScopeApiValue;
  tagMountSpecifiedUsers?: string[];
  grantedActions?: TagResourceActionApiKey[];
}

export interface ChangeTagApiRequest extends Omit<AddTagApiRequest, 'parentId' | 'tagName'> {
  tagName?: string;
  targetTagId: string;
}

export interface RemoveTagApiRequest {
  groupId?: string;
  targetTagId: string;
}

export interface MoveTagApiRequest extends RemoveTagApiRequest {
  newParentId?: string;
}

export interface GetTagTreeApiRequest {
  groupId?: string;
}

export interface TagTreeApiResponse {
  tagId: string;
  tagName: string;
  groupId?: string;
  tagDesc?: string;
  tagIcon?: string;
  tagColor?: string;
  tagMetaInfo?: string;
  tagCreator?: string;
  isPath?: boolean;
  visibilityMode?: string;
  taggedResourceAclGrantScope?: TagAccessControlScopeApiValue;
  taggedResourceAclGrantSpecifiedUsers?: string[];
  taggedResourceGrantedActionsMask?: number;
  tagMountPermissionScope?: TagAccessControlScopeApiValue;
  tagMountSpecifiedUsers?: string[];
  grantedActions?: Array<TagResourceActionApiKey | NumericEnumApiValue>;
  parentId?: string;
  children?: TagTreeApiResponse[];
}

export type GetTagTreeApiResponse = TagTreeApiResponse[];
