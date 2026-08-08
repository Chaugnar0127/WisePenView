import { useDriveService } from '@/domains';
import type { DriveNode, DriveNodeScope } from '@/domains/Drive';
import { buildLoadingNode } from '@/domains/Drive/mapper/DriveServices.map';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UseDriveTreeChildrenParams {
  groupId?: string;
  scope?: DriveNodeScope;
  /** 每个展开目录的资源/link 页大小，文件夹仍完整返回。 */
  resourceSize?: number;
}

interface UseDriveTreeChildrenReturn {
  childrenMap: Map<string, DriveNode[]>;
  loadChildren: (nodeId: string) => Promise<DriveNode[]>;
  loadMoreChildren: (nodeId: string) => Promise<void>;
  reset: () => void;
}

interface ChildrenPageState {
  resourcePage: number;
  hasMore: boolean;
}

export function useDriveTreeChildren({
  groupId,
  scope,
  resourceSize,
}: UseDriveTreeChildrenParams): UseDriveTreeChildrenReturn {
  const { t } = useTranslation('drive');
  const driveService = useDriveService();
  const [childrenMap, setChildrenMap] = useState<Map<string, DriveNode[]>>(new Map());
  const [pageStateMap, setPageStateMap] = useState<Map<string, ChildrenPageState>>(new Map());
  const loadingMoreNodeIdsRef = useRef<Set<string>>(new Set());

  const buildLoadMoreNode = (nodeId: string, loaded: number, total: number): DriveNode =>
    buildLoadingNode(nodeId, t('node.loadMoreProgress', { loaded, total }), scope);

  const countResourceNodes = (children: DriveNode[]): number =>
    children.filter((node) => node.type === 'resource' || node.type === 'link').length;

  const appendLoadMoreNode = (
    nodeId: string,
    children: DriveNode[],
    hasMore: boolean,
    resourceTotal: number
  ) =>
    hasMore
      ? [...children, buildLoadMoreNode(nodeId, countResourceNodes(children), resourceTotal)]
      : children;

  const setNodeChildren = (nodeId: string, children: DriveNode[]) => {
    setChildrenMap((prev) => {
      const next = new Map(prev);
      next.set(nodeId, children);
      return next;
    });
  };

  const loadChildren = async (nodeId: string): Promise<DriveNode[]> => {
    setNodeChildren(nodeId, [buildLoadingNode(nodeId, t('node.loading'), scope)]);
    try {
      const result = await driveService.listNodeChildrenPage({
        nodeId,
        groupId,
        resourcePage: 1,
        resourceSize,
      });
      setPageStateMap((prev) => {
        const next = new Map(prev);
        next.set(nodeId, {
          resourcePage: result.resourcePage,
          hasMore: result.hasMoreResources,
        });
        return next;
      });
      const children = appendLoadMoreNode(
        nodeId,
        result.nodes,
        result.hasMoreResources,
        result.resourceTotal
      );
      setNodeChildren(nodeId, children);
      return children;
    } catch (err) {
      toast.danger(parseErrorMessage(err));
      setNodeChildren(nodeId, []);
      return [];
    }
  };

  const loadMoreChildren = async (nodeId: string): Promise<void> => {
    const pageState = pageStateMap.get(nodeId);
    if (!pageState?.hasMore) return;
    if (loadingMoreNodeIdsRef.current.has(nodeId)) return;
    loadingMoreNodeIdsRef.current.add(nodeId);
    const currentChildren = childrenMap.get(nodeId) ?? [];
    setNodeChildren(nodeId, [
      ...currentChildren.filter((node) => node.type !== 'loading'),
      buildLoadingNode(nodeId, t('node.loading'), scope),
    ]);
    try {
      const result = await driveService.listNodeChildrenPage({
        nodeId,
        groupId,
        resourcePage: pageState.resourcePage + 1,
        resourceSize,
        includeFolders: false,
      });
      setPageStateMap((prev) => {
        const next = new Map(prev);
        next.set(nodeId, {
          resourcePage: result.resourcePage,
          hasMore: result.hasMoreResources,
        });
        return next;
      });
      setNodeChildren(
        nodeId,
        appendLoadMoreNode(
          nodeId,
          [...currentChildren.filter((node) => node.type !== 'loading'), ...result.resourceNodes],
          result.hasMoreResources,
          result.resourceTotal
        )
      );
    } catch (err) {
      toast.danger(parseErrorMessage(err));
      setNodeChildren(nodeId, currentChildren);
    } finally {
      loadingMoreNodeIdsRef.current.delete(nodeId);
    }
  };

  const reset = () => {
    setChildrenMap(new Map());
    setPageStateMap(new Map());
    loadingMoreNodeIdsRef.current.clear();
  };

  return {
    childrenMap,
    loadChildren,
    loadMoreChildren,
    reset,
  };
}
