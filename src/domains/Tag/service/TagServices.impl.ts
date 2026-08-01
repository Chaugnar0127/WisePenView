import { registerServiceCacheCleaner } from '@/domains/_shared/cacheRegistry';
import { createTtlCache } from '@/domains/_shared/ttlCache';
import type { IResourceService } from '@/domains/Resource';
import { RESOURCE_SORT_BY, RESOURCE_SORT_DIR } from '@/domains/Resource';
import type { TagListByTagResponse, TagTreeNode } from '@/domains/Tag';
import { normalizeTagGroupId } from '@/utils/normalize/normalizeTagGroupId';
import { TagApi } from '../apis/TagApi';
import { TagServicesMap } from '../mapper/TagServices.map';
import type {
  GetResByTagRequest,
  ITagService,
  TagCreateRequest,
  TagDeleteRequest,
  TagMoveRequest,
  TagUpdateRequest,
} from './index.type';

const CACHE_KEY_DEFAULT = '__default__';
const TAG_TREE_CACHE_TTL_MS = 15_000;
/** 系统保留前缀：以 `.` 开头的 tag（如 `.Trash`）对 Tag 视图不可见 */
const HIDDEN_TAG_PREFIX = '.';
const TRASH_FOLDER_NAME = '.Trash';

const buildFlatMap = (roots: TagTreeNode[]): Map<string, TagTreeNode> => {
  const map = new Map<string, TagTreeNode>();
  const walk = (node: TagTreeNode) => {
    map.set(node.tagId, node);
    (node.children ?? []).forEach(walk);
  };
  roots.forEach(walk);
  return map;
};

const filterHiddenTags = (nodes: TagTreeNode[]): TagTreeNode[] => {
  const filtered: TagTreeNode[] = [];
  for (const node of nodes) {
    if ((node.tagName ?? '').trim().startsWith(HIDDEN_TAG_PREFIX)) {
      continue;
    }
    filtered.push({
      ...node,
      children: Array.isArray(node.children) ? filterHiddenTags(node.children) : undefined,
    });
  }
  return filtered;
};

interface TagServicesDeps {
  resourceService: IResourceService;
}

export const createTagServices = (deps: TagServicesDeps): ITagService => {
  const { resourceService } = deps;

  /** 按 groupId 存储已拉取的原始标签树；写操作后清除，读缓存自动过期。 */
  const rawTagTreeCache = createTtlCache<string, TagTreeNode[]>(TAG_TREE_CACHE_TTL_MS);
  /** 扁平索引：cacheKey → (tagId → TagTreeNode)，与 rawTagTreeCache 同步维护并自动过期。 */
  const rawTagFlatCache = createTtlCache<string, Map<string, TagTreeNode>>(TAG_TREE_CACHE_TTL_MS);
  /** 按 groupId 存储已拉取的过滤后标签树；写操作后清除，读缓存自动过期。 */
  const tagTreeCache = createTtlCache<string, TagTreeNode[]>(TAG_TREE_CACHE_TTL_MS);
  /** 扁平索引：cacheKey → (tagId → TagTreeNode)，与 tagTreeCache 同步维护并自动过期。 */
  const tagFlatCache = createTtlCache<string, Map<string, TagTreeNode>>(TAG_TREE_CACHE_TTL_MS);
  /** 系统回收站属于原始标签树元数据，不进入 UI 过滤后的 tagTreeCache，并跟随原始树过期。 */
  const trashTagIdCache = createTtlCache<string, string>(TAG_TREE_CACHE_TTL_MS);

  const syncTrashTagId = (groupId: string | undefined, roots: TagTreeNode[]): void => {
    const cacheKey = normalizeTagGroupId(groupId) ?? CACHE_KEY_DEFAULT;
    const queue: TagTreeNode[] = [...roots];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) continue;
      if (node.tagName === TRASH_FOLDER_NAME) {
        trashTagIdCache.set(cacheKey, node.tagId);
        return;
      }
      if (Array.isArray(node.children) && node.children.length > 0) {
        queue.push(...node.children);
      }
    }
    trashTagIdCache.delete(cacheKey);
  };

  const clearTagTreeCache = (groupId?: string): void => {
    if (groupId !== undefined) {
      const cacheKey = normalizeTagGroupId(groupId) ?? CACHE_KEY_DEFAULT;
      rawTagTreeCache.delete(cacheKey);
      rawTagFlatCache.delete(cacheKey);
      tagTreeCache.delete(cacheKey);
      tagFlatCache.delete(cacheKey);
      trashTagIdCache.delete(cacheKey);
    } else {
      rawTagTreeCache.clear();
      rawTagFlatCache.clear();
      tagTreeCache.clear();
      tagFlatCache.clear();
      trashTagIdCache.clear();
    }
  };

  registerServiceCacheCleaner(() => clearTagTreeCache());

  const getRawTagTree = async (
    groupId?: string,
    options?: { refresh?: boolean }
  ): Promise<TagTreeNode[]> => {
    const normalizedGroupId = normalizeTagGroupId(groupId);
    const cacheKey = normalizedGroupId ?? CACHE_KEY_DEFAULT;
    const cached = rawTagTreeCache.get(cacheKey);
    if (cached && !options?.refresh) {
      return cached;
    }
    tagTreeCache.delete(cacheKey);
    tagFlatCache.delete(cacheKey);
    const params = TagServicesMap.mapGetTagTreeRequest(normalizedGroupId);
    const data = await TagApi.getTagTree(params);
    const roots = TagServicesMap.mapTagTreeFromApi(data);
    syncTrashTagId(normalizedGroupId, roots);
    rawTagTreeCache.set(cacheKey, roots);
    rawTagFlatCache.set(cacheKey, buildFlatMap(roots));
    return roots;
  };

  const getRawTagById = (tagId: string, groupId?: string): TagTreeNode | undefined => {
    const cacheKey = normalizeTagGroupId(groupId) ?? CACHE_KEY_DEFAULT;
    return rawTagFlatCache.get(cacheKey)?.get(tagId);
  };

  const getTagTree = async (
    groupId?: string,
    options?: { refresh?: boolean }
  ): Promise<TagTreeNode[]> => {
    const normalizedGroupId = normalizeTagGroupId(groupId);
    const cacheKey = normalizedGroupId ?? CACHE_KEY_DEFAULT;
    const cached = tagTreeCache.get(cacheKey);
    if (cached && !options?.refresh) {
      return cached;
    }

    const rawRoots = await getRawTagTree(normalizedGroupId, options);
    // 剥离路径型（folder）与系统保留前缀（`.` 开头）
    const nonFolderRoots: TagTreeNode[] = rawRoots.filter(
      (item) => !(item.tagName && item.tagName.startsWith('/'))
    );
    const roots: TagTreeNode[] = filterHiddenTags(nonFolderRoots);
    tagTreeCache.set(cacheKey, roots);
    tagFlatCache.set(cacheKey, buildFlatMap(roots));
    return roots;
  };

  const getTagById = (tagId: string, groupId?: string): TagTreeNode | undefined => {
    const cacheKey = normalizeTagGroupId(groupId) ?? CACHE_KEY_DEFAULT;
    return tagFlatCache.get(cacheKey)?.get(tagId);
  };

  const getTrashTagId = (groupId?: string): string | undefined => {
    const cacheKey = normalizeTagGroupId(groupId) ?? CACHE_KEY_DEFAULT;
    return trashTagIdCache.get(cacheKey);
  };

  const updateTag = async (params: TagUpdateRequest): Promise<void> => {
    const payload = TagServicesMap.mapUpdateTagRequest(params);
    await TagApi.changeTag(payload);
    clearTagTreeCache(params.groupId);
  };

  const addTag = async (params: TagCreateRequest): Promise<string> => {
    const payload = TagServicesMap.mapAddTagRequest(params);
    const data = await TagApi.addTag(payload);
    clearTagTreeCache(params.groupId);
    return TagServicesMap.mapAddTagFromApi(data);
  };

  const deleteTag = async (params: TagDeleteRequest): Promise<void> => {
    await TagApi.removeTag(params);
    clearTagTreeCache(params.groupId);
  };

  const getResByTag = async (params: GetResByTagRequest): Promise<TagListByTagResponse> => {
    const targetTag = params.tag;
    await getTagTree(targetTag.groupId);
    const tag = getTagById(targetTag.tagId, targetTag.groupId);
    const tags = tag?.children ?? [];
    const filePage = params.filePage ?? 1;
    const filePageSize = params.filePageSize ?? 20;
    const listParams = {
      page: filePage,
      size: filePageSize,
      sortBy: RESOURCE_SORT_BY.UPDATE_TIME,
      sortDir: RESOURCE_SORT_DIR.DESC,
      tagIds: [targetTag.tagId],
      tagQueryLogicMode: 'AND' as const,
    };
    const normalizedGroupId = normalizeTagGroupId(targetTag.groupId);
    const res = normalizedGroupId
      ? await resourceService.getGroupResources({ ...listParams, groupId: normalizedGroupId })
      : await resourceService.getUserResources(listParams);

    return { tags, files: res.list, totalFiles: res.total };
  };

  const moveTag = async (params: TagMoveRequest): Promise<void> => {
    await TagApi.moveTag(params);
    clearTagTreeCache(params.groupId);
  };

  return {
    getRawTagTree,
    getRawTagById,
    getTagTree,
    getTagById,
    getTrashTagId,
    getResByTag,
    updateTag,
    addTag,
    deleteTag,
    moveTag,
  };
};
