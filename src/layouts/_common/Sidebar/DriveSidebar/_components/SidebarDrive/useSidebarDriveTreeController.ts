import { replaceDriveTreeNodeChildren } from '@/components/Drive/common/buildDriveTreeData';
import { getDriveScopeGroupId } from '@/components/Drive/common/driveComponentModel';
import type { DataNode } from '@/components/Tree';
import { useDriveService } from '@/domains';
import type { DriveNode, DriveNodeScope } from '@/domains/Drive';
import { buildLoadingNode } from '@/domains/Drive/mapper/DriveServices.map';
import { useSidebarDriveExpansionStore } from '@/layouts/_common/Sidebar/DriveSidebar/_store/useSidebarDriveExpansionStore';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useRef, useState, type Key } from 'react';
import { useTranslation } from 'react-i18next';
import { isSidebarResourceNode } from './sidebarDriveModel';

const SIDEBAR_DRIVE_FOLDER_PAGE_SIZE = 50;

interface SidebarTreeLoadResult {
  treeData: DataNode[];
  nodeMap: Map<string, DriveNode>;
  folderChildrenMap: Map<string, DriveNode[]>;
  folderPageMap: Map<string, SidebarFolderPageState>;
  expandedKeys: Key[];
}

interface SidebarDriveTreeControls {
  handleCollapseAll: () => void;
  handleLoadMore: (parentNodeId: string) => void;
}

interface SidebarFolderPageState {
  folderPage: number;
  folderSize: number;
  folderTotal: number;
  hasMoreFolders: boolean;
}

interface UseSidebarDriveTreeControllerOptions {
  scope: DriveNodeScope;
  rootDisplayName?: string;
  buildTreeData: (
    nodes: DriveNode[],
    nodeMap: Map<string, DriveNode>,
    controls: SidebarDriveTreeControls
  ) => DataNode[];
  onOpenResource: (node: Extract<DriveNode, { type: 'resource' | 'link' }>) => void;
}

export function useSidebarDriveTreeController({
  scope,
  rootDisplayName,
  buildTreeData,
  onOpenResource,
}: UseSidebarDriveTreeControllerOptions) {
  const { t } = useTranslation('drive');
  const driveService = useDriveService();
  const expansionScopeKey = scope.rootId;
  const groupId = getDriveScopeGroupId(scope);
  const [nodeMap, setNodeMap] = useState<Map<string, DriveNode>>(new Map());
  const [folderChildrenMap, setFolderChildrenMap] = useState<Map<string, DriveNode[]>>(new Map());
  const [folderPageMap, setFolderPageMap] = useState<Map<string, SidebarFolderPageState>>(
    new Map()
  );
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const loadingMoreNodeIdsRef = useRef<Set<string>>(new Set());
  const handleCollapseAll = () => {
    setExpandedKeys([]);
    useSidebarDriveExpansionStore.getState().setExpandedNodeIds(expansionScopeKey, []);
  };
  const treeControls = { handleCollapseAll, handleLoadMore };
  const toPageState = (result: {
    folderPage: number;
    folderSize: number;
    folderTotal: number;
    hasMoreFolders: boolean;
  }): SidebarFolderPageState => ({
    folderPage: result.folderPage,
    folderSize: result.folderSize,
    folderTotal: result.folderTotal,
    hasMoreFolders: result.hasMoreFolders,
  });
  const withLoadMoreNode = (
    parentNodeId: string,
    children: DriveNode[],
    pageState: SidebarFolderPageState,
    nodeScope: DriveNodeScope
  ): DriveNode[] => {
    if (!pageState.hasMoreFolders) return children;
    return [
      ...children,
      buildLoadingNode(
        parentNodeId,
        t('node.loadMoreProgress', {
          loaded: children.length,
          total: pageState.folderTotal,
        }),
        nodeScope
      ),
    ];
  };
  const replaceSidebarTreeChildren = (
    currentTreeData: DataNode[],
    parentNodeId: string,
    childData: DataNode[]
  ): DataNode[] => {
    if (parentNodeId === scope.rootId) {
      const [rootTreeNode] = currentTreeData;
      return rootTreeNode ? [rootTreeNode, ...childData] : childData;
    }
    return replaceDriveTreeNodeChildren(currentTreeData, parentNodeId, childData);
  };

  const { loading: treeLoading, refresh: refreshTree } = useRequest(
    async (): Promise<SidebarTreeLoadResult> => {
      const nextNodeMap = new Map<string, DriveNode>();
      const nextFolderChildrenMap = new Map<string, DriveNode[]>();
      const nextFolderPageMap = new Map<string, SidebarFolderPageState>();
      const expandedNodeIds = new Set(
        useSidebarDriveExpansionStore.getState().expandedNodeIdsByScope[expansionScopeKey] ?? []
      );
      const rootNode = await driveService.getRootNode({ rootId: scope.rootId, groupId });
      const rootResult = await driveService.listFolderChildrenPage({
        nodeId: rootNode.id,
        groupId,
        folderSize: SIDEBAR_DRIVE_FOLDER_PAGE_SIZE,
      });
      const rootPageState = toPageState(rootResult);
      const rootChildren = withLoadMoreNode(
        rootNode.id,
        rootResult.folderNodes,
        rootPageState,
        rootNode.scope
      );
      const baseRoot = buildTreeData([rootNode], nextNodeMap, treeControls)[0];
      if (!baseRoot) {
        return {
          treeData: [],
          nodeMap: nextNodeMap,
          folderChildrenMap: nextFolderChildrenMap,
          folderPageMap: nextFolderPageMap,
          expandedKeys: [],
        };
      }

      const childrenByParent = new Map<string, DriveNode[]>([[rootNode.id, rootChildren]]);
      nextFolderChildrenMap.set(rootNode.id, rootChildren);
      nextFolderPageMap.set(rootNode.id, rootPageState);
      const loadExpandedChildren = async (nodes: DriveNode[]): Promise<void> => {
        await Promise.all(
          nodes.map(async (node) => {
            if (node.type !== 'folder' || !expandedNodeIds.has(node.id)) return;
            try {
              const result = await driveService.listFolderChildrenPage({
                nodeId: node.id,
                groupId,
                folderSize: SIDEBAR_DRIVE_FOLDER_PAGE_SIZE,
              });
              const pageState = toPageState(result);
              const children = withLoadMoreNode(node.id, result.folderNodes, pageState, node.scope);
              childrenByParent.set(node.id, children);
              nextFolderChildrenMap.set(node.id, children);
              nextFolderPageMap.set(node.id, pageState);
              await loadExpandedChildren(result.folderNodes);
            } catch {
              expandedNodeIds.delete(node.id);
            }
          })
        );
      };
      await loadExpandedChildren(rootChildren);

      const buildExpandedTree = (nodes: DriveNode[]): DataNode[] =>
        buildTreeData(nodes, nextNodeMap, treeControls).map((treeNode) => {
          const children = childrenByParent.get(String(treeNode.key));
          return children ? { ...treeNode, children: buildExpandedTree(children) } : treeNode;
        });
      const expandedTreeChildren = buildExpandedTree(rootChildren);
      const availableExpandedNodeIds = [...expandedNodeIds].filter(
        (nodeId) => nextNodeMap.get(nodeId)?.type === 'folder'
      );
      return {
        treeData: [{ ...baseRoot, children: undefined, isLeaf: true }, ...expandedTreeChildren],
        nodeMap: nextNodeMap,
        folderChildrenMap: nextFolderChildrenMap,
        folderPageMap: nextFolderPageMap,
        expandedKeys: availableExpandedNodeIds,
      };
    },
    {
      refreshDeps: [expansionScopeKey, scope.rootId, groupId, rootDisplayName],
      onSuccess: (result) => {
        setNodeMap(result.nodeMap);
        setFolderChildrenMap(result.folderChildrenMap);
        setFolderPageMap(result.folderPageMap);
        setTreeData(result.treeData);
        setExpandedKeys(result.expandedKeys);
        setSelectedKeys([]);
        loadingMoreNodeIdsRef.current.clear();
        useSidebarDriveExpansionStore
          .getState()
          .setExpandedNodeIds(expansionScopeKey, result.expandedKeys.map(String));
      },
      onError: (error) => {
        setNodeMap(new Map());
        setFolderChildrenMap(new Map());
        setFolderPageMap(new Map());
        setTreeData([]);
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const handleLoadData = async (treeNode: DataNode): Promise<void> => {
    const key = String(treeNode.key);
    const node = nodeMap.get(key);
    if (!node || (node.type !== 'root' && node.type !== 'folder')) return;
    try {
      const result = await driveService.listFolderChildrenPage({
        nodeId: node.id,
        groupId: getDriveScopeGroupId(node.scope),
        folderSize: SIDEBAR_DRIVE_FOLDER_PAGE_SIZE,
        refresh: true,
      });
      const pageState = toPageState(result);
      const children = withLoadMoreNode(node.id, result.folderNodes, pageState, node.scope);
      const childNodeMap = new Map<string, DriveNode>();
      const childData = buildTreeData(children, childNodeMap, treeControls);
      setNodeMap((currentNodeMap) => {
        const nextNodeMap = new Map(currentNodeMap);
        childNodeMap.forEach((childNode, childNodeId) => nextNodeMap.set(childNodeId, childNode));
        return nextNodeMap;
      });
      setFolderChildrenMap((current) => new Map(current).set(node.id, children));
      setFolderPageMap((current) => new Map(current).set(node.id, pageState));
      setTreeData((current) => replaceSidebarTreeChildren(current, node.id, childData));
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    }
  };
  async function handleLoadMore(parentNodeId: string): Promise<void> {
    const parentNode = nodeMap.get(parentNodeId);
    const pageState = folderPageMap.get(parentNodeId);
    if (!parentNode || (parentNode.type !== 'root' && parentNode.type !== 'folder')) return;
    if (!pageState?.hasMoreFolders || loadingMoreNodeIdsRef.current.has(parentNodeId)) return;

    loadingMoreNodeIdsRef.current.add(parentNodeId);
    try {
      const result = await driveService.listFolderChildrenPage({
        nodeId: parentNode.id,
        groupId: getDriveScopeGroupId(parentNode.scope),
        folderPage: pageState.folderPage + 1,
        folderSize: pageState.folderSize,
      });
      const nextPageState = toPageState(result);
      const currentChildren =
        folderChildrenMap.get(parentNodeId)?.filter((node) => node.type !== 'loading') ?? [];
      const nextChildren = withLoadMoreNode(
        parentNode.id,
        [...currentChildren, ...result.folderNodes],
        nextPageState,
        parentNode.scope
      );
      const childNodeMap = new Map<string, DriveNode>();
      const childData = buildTreeData(nextChildren, childNodeMap, treeControls);
      setNodeMap((currentNodeMap) => {
        const nextNodeMap = new Map(currentNodeMap);
        childNodeMap.forEach((childNode, childNodeId) => nextNodeMap.set(childNodeId, childNode));
        return nextNodeMap;
      });
      setFolderChildrenMap((current) => new Map(current).set(parentNode.id, nextChildren));
      setFolderPageMap((current) => new Map(current).set(parentNode.id, nextPageState));
      setTreeData((current) => replaceSidebarTreeChildren(current, parentNode.id, childData));
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    } finally {
      loadingMoreNodeIdsRef.current.delete(parentNodeId);
    }
  }
  const handleSelect = (_keys: Key[], info: { node: DataNode }) => {
    const key = String(info.node.key);
    const node = nodeMap.get(key);
    if (!isSidebarResourceNode(node)) return;
    setSelectedKeys([key]);
    onOpenResource(node);
  };
  const handleExpand = (nextKeys: Key[], info: { node: DataNode; expanded: boolean }) => {
    setExpandedKeys(nextKeys);
    useSidebarDriveExpansionStore
      .getState()
      .setExpandedNodeIds(expansionScopeKey, nextKeys.map(String));
    if (info.expanded && info.node.children === undefined) {
      void handleLoadData(info.node);
    }
  };
  return {
    expandedKeys,
    handleCollapseAll,
    handleExpand,
    handleLoadData,
    handleSelect,
    nodeMap,
    refreshTree,
    selectedKeys,
    treeData,
    treeLoading,
  };
}
