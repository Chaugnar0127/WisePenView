import type { DriveNode, FolderNode, LinkNode, ResourceNode, RootNode } from '../entity/drive';

export interface IDriveService {
  /**
   * 获取某个 Drive scope 的根节点。
   * - 个人盘 root 抽象为 ~/，背后绑定唯一顶层 root tag，可挂载资源。
   * - 小组 root 抽象为 group 本身，是虚拟容器，不可直接挂载资源。
   */
  getRootNode(params?: GetRootNodeParams): Promise<RootNode>;
  /** 获取当前 scope 的回收站文件夹节点 ID；系统目录缺失时抛出客户端错误。 */
  getTrashFolderNodeId(groupId?: string): Promise<string>;
  /** 仅获取直接子文件夹，用于侧边栏、移动弹窗等目录导航场景。 */
  listFolderChildren(params: ListFolderChildrenParams): Promise<FolderNode[]>;
  /** 获取目录直接子节点页；文件夹完整返回，资源/link 按页返回。 */
  listNodeChildrenPage(params: ListNodeChildrenPageParams): Promise<ListNodeChildrenPageResult>;
  getNodePath(params: GetNodePathParams): Promise<Array<RootNode | FolderNode>>;
  /** 按当前父目录定位资源挂载，供资源详情页识别主文件与 link。 */
  getResourceNode(params: GetResourceNodeParams): Promise<ResourceNode | LinkNode | undefined>;
  moveToFolder(params: MoveToFolderParams): Promise<void>;
  /** 为主文件在同一 scope 的目标目录创建 link。 */
  createLink(params: CreateLinkParams): Promise<void>;
  /** 批量移动并返回实际改变父目录的节点数。 */
  moveNodesToFolder(params: MoveNodesToFolderParams): Promise<number>;
  removeNode(params: RemoveNodeParams): Promise<void>;
  renameNode(params: RenameNodeParams): Promise<void>;
  createFolder(params: CreateFolderParams): Promise<string>;
}

export interface GetRootNodeParams {
  rootId?: string;
  groupId?: string;
}

export interface ListFolderChildrenParams {
  nodeId: string;
  groupId?: string;
  /** 强制刷新底层目录树缓存，适用于用户点击展开等实时性入口。 */
  refresh?: boolean;
}

export interface ListNodeChildrenPageParams {
  nodeId: string;
  groupId?: string;
  /** 资源/link 页码，从 1 开始。 */
  resourcePage?: number;
  /** 资源/link 每页数量。 */
  resourceSize?: number;
  /** 是否同时返回直接子文件夹；滚底追加页可关闭。 */
  includeFolders?: boolean;
  /** 强制刷新底层目录树缓存，适用于用户点击展开等实时性入口。 */
  refresh?: boolean;
}

export interface ListNodeChildrenPageResult {
  nodes: DriveNode[];
  folderNodes: FolderNode[];
  resourceNodes: Array<ResourceNode | LinkNode>;
  resourcePage: number;
  resourceSize: number;
  resourceTotal: number;
  resourceTotalPage: number;
  hasMoreResources: boolean;
}

export interface GetNodePathParams {
  nodeId: string;
  groupId?: string;
}

export interface GetResourceNodeParams {
  resourceId: string;
  parentNodeId: string;
  nodeId?: string;
  groupId?: string;
}

export interface CreateLinkParams {
  nodeId: string;
  targetFolderNodeId: string;
  groupId?: string;
}

export interface MoveToFolderParams {
  nodeId: string;
  targetFolderNodeId: string;
  groupId?: string;
}

export interface MoveNodesToFolderParams {
  nodeIds: string[];
  targetFolderNodeId: string;
  groupId?: string;
}

export interface RemoveNodeParams {
  nodeId: string;
  groupId?: string;
}

export interface RenameNodeParams {
  nodeId: string;
  newName: string;
  groupId?: string;
}

export interface CreateFolderParams {
  parentId: string;
  name: string;
  groupId?: string;
}

/** Service 工厂选项：默认 pageSize = 50 */
export interface CreateDriveServiceOptions {
  pageSize?: number;
}
