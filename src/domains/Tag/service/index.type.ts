/**
 * Tag 相关类型与 ITagService
 * 与 docs/apis/resource.openapi.json 中 Tag 相关 schema、路径一致（无字段重命名）
 */

import type {
  AccessControlScope,
  TagListByTagResponse,
  TagResourceAction,
  TagTreeNode,
  TagVisibilityModeString,
} from '@/domains/Tag';

/** TagService 接口：供依赖注入使用 */
export interface ITagService {
  /** 获取未过滤的原始标签树（包含路径标签与系统隐藏标签） */
  getRawTagTree(groupId?: string, options?: GetTagTreeOptions): Promise<TagTreeNode[]>;
  /** 从原始标签索引中按 tagId 查找节点（需先调用 getRawTagTree） */
  getRawTagById(tagId: string, groupId?: string): TagTreeNode | undefined;
  /** 获取标签树（带自动过期缓存），返回多个根节点 */
  getTagTree(groupId?: string, options?: GetTagTreeOptions): Promise<TagTreeNode[]>;
  /** 从已缓存的扁平索引中按 tagId 查找标签节点（需先调用 getTagTree） */
  getTagById(tagId: string, groupId?: string): TagTreeNode | undefined;
  /** 获取原始标签树中解析出的系统回收站 tagId。 */
  getTrashTagId(groupId?: string): string | undefined;
  /** 获取某标签下的子标签 + 文件列表（分页） */
  getResByTag(params: GetResByTagRequest): Promise<TagListByTagResponse>;
  updateTag(params: TagUpdateRequest): Promise<void>;
  addTag(params: TagCreateRequest): Promise<string>;
  deleteTag(params: TagDeleteRequest): Promise<void>;
  moveTag(params: TagMoveRequest): Promise<void>;
}

export interface GetTagTreeOptions {
  /** 强制绕过本地缓存重新拉取，适用于系统目录被外部手段修改后的恢复检查。 */
  refresh?: boolean;
}

/** getResByTag 请求参数 */
export interface GetResByTagRequest {
  tag: TagTreeNode;
  filePage?: number;
  filePageSize?: number;
}

/** POST /resource/tag/addTag */
export interface TagCreateRequest {
  groupId?: string;
  parentId?: string;
  tagName: string;
  tagDesc?: string;
  tagIcon?: string;
  tagColor?: string;
  tagCreator?: string;
  isPath?: boolean;
  visibilityMode?: TagVisibilityModeString;
  taggedResourceAclGrantScope?: AccessControlScope;
  taggedResourceAclGrantSpecifiedUsers?: string[];
  tagMountPermissionScope?: AccessControlScope;
  tagMountSpecifiedUsers?: string[];
  grantedActions?: TagResourceAction[];
}

/** POST /resource/tag/changeTag */
export interface TagUpdateRequest {
  groupId?: string;
  tagName?: string;
  tagDesc?: string;
  tagIcon?: string;
  tagColor?: string;
  tagCreator?: string;
  isPath?: boolean;
  visibilityMode?: TagVisibilityModeString;
  taggedResourceAclGrantScope?: AccessControlScope;
  taggedResourceAclGrantSpecifiedUsers?: string[];
  tagMountPermissionScope?: AccessControlScope;
  tagMountSpecifiedUsers?: string[];
  grantedActions?: TagResourceAction[];
  targetTagId: string;
}

/** POST /resource/tag/removeTag */
export interface TagDeleteRequest {
  groupId?: string;
  targetTagId: string;
}

/** POST /resource/tag/moveTag */
export interface TagMoveRequest {
  groupId?: string;
  targetTagId: string;
  newParentId?: string;
}
