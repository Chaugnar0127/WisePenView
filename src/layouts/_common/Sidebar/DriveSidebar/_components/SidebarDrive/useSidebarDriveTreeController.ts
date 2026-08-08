import { replaceDriveTreeNodeChildren } from '@/components/Drive/common/buildDriveTreeData';
import { getDriveScopeGroupId } from '@/components/Drive/common/driveComponentModel';
import type { DataNode } from '@/components/Tree';
import { useDriveService } from '@/domains';
import type { DriveNode, DriveNodeScope } from '@/domains/Drive';
import { useSidebarDriveExpansionStore } from '@/layouts/_common/Sidebar/DriveSidebar/_store/useSidebarDriveExpansionStore';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { isSidebarResourceNode } from './sidebarDriveModel';

interface SidebarTreeLoadResult {
  treeData: DataNode[];
  nodeMap: Map<string, DriveNode>;
  expandedKeys: React.Key[];
}

interface SidebarDriveTreeControls {
  handleCollapseAll: () => void;
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
  const driveService = useDriveService();
  const expansionScopeKey = scope.rootId;
  const groupId = getDriveScopeGroupId(scope);
  const [nodeMap, setNodeMap] = useState<Map<string, DriveNode>>(new Map());
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const handleCollapseAll = () => {
    setExpandedKeys([]);
    useSidebarDriveExpansionStore.getState().setExpandedNodeIds(expansionScopeKey, []);
  };
  const treeControls = { handleCollapseAll };

  const { loading: treeLoading, refresh: refreshTree } = useRequest(
    async (): Promise<SidebarTreeLoadResult> => {
      const nextNodeMap = new Map<string, DriveNode>();
      const expandedNodeIds = new Set(
        useSidebarDriveExpansionStore.getState().expandedNodeIdsByScope[expansionScopeKey] ?? []
      );
      const rootNode = await driveService.getRootNode({ rootId: scope.rootId, groupId });
      const rootChildren = await driveService.listFolderChildren({ nodeId: rootNode.id, groupId });
      const baseRoot = buildTreeData([rootNode], nextNodeMap, treeControls)[0];
      if (!baseRoot) return { treeData: [], nodeMap: nextNodeMap, expandedKeys: [] };

      const childrenByParent = new Map<string, DriveNode[]>([[rootNode.id, rootChildren]]);
      const loadExpandedChildren = async (nodes: DriveNode[]): Promise<void> => {
        await Promise.all(
          nodes.map(async (node) => {
            if (node.type !== 'folder' || !expandedNodeIds.has(node.id)) return;
            try {
              const children = await driveService.listFolderChildren({ nodeId: node.id, groupId });
              childrenByParent.set(node.id, children);
              await loadExpandedChildren(children);
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
        expandedKeys: availableExpandedNodeIds,
      };
    },
    {
      refreshDeps: [expansionScopeKey, scope.rootId, groupId, rootDisplayName],
      onSuccess: (result) => {
        setNodeMap(result.nodeMap);
        setTreeData(result.treeData);
        setExpandedKeys(result.expandedKeys);
        setSelectedKeys([]);
        useSidebarDriveExpansionStore
          .getState()
          .setExpandedNodeIds(expansionScopeKey, result.expandedKeys.map(String));
      },
      onError: (error) => {
        setNodeMap(new Map());
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
      const children = await driveService.listFolderChildren({
        nodeId: node.id,
        groupId: getDriveScopeGroupId(node.scope),
        refresh: true,
      });
      const childNodeMap = new Map<string, DriveNode>();
      const childData = buildTreeData(children, childNodeMap, treeControls);
      setNodeMap((currentNodeMap) => {
        const nextNodeMap = new Map(currentNodeMap);
        childNodeMap.forEach((childNode, childNodeId) => nextNodeMap.set(childNodeId, childNode));
        return nextNodeMap;
      });
      setTreeData((current) => replaceDriveTreeNodeChildren(current, node.id, childData));
    } catch (error) {
      toast.danger(parseErrorMessage(error));
    }
  };
  const handleSelect = (_keys: React.Key[], info: { node: DataNode }) => {
    const key = String(info.node.key);
    const node = nodeMap.get(key);
    if (!isSidebarResourceNode(node)) return;
    setSelectedKeys([key]);
    onOpenResource(node);
  };
  const handleExpand = (nextKeys: React.Key[], info: { node: DataNode; expanded: boolean }) => {
    setExpandedKeys(nextKeys);
    useSidebarDriveExpansionStore
      .getState()
      .setExpandedNodeIds(expansionScopeKey, nextKeys.map(String));
    if (info.expanded && info.node.children !== undefined) {
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
