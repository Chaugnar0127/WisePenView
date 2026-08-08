import type { DriveNode } from '@/domains/Drive';
import { buildLoadingNode } from '@/domains/Drive/mapper/DriveServices.map';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DrivePagedTreePageResult {
  nodes: DriveNode[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

interface DrivePagedTreePageParams {
  nodeId: string;
  page: number;
  size?: number;
  refresh?: boolean;
  mode: 'initial' | 'more';
}

interface DrivePagedTreePageState {
  page: number;
  size?: number;
  total: number;
  hasMore: boolean;
}

interface UseDrivePagedTreeChildrenParams {
  pageSize?: number;
  loadPage: (params: DrivePagedTreePageParams) => Promise<DrivePagedTreePageResult>;
  countLoaded?: (children: DriveNode[]) => number;
  buildLoadingPlaceholder?: (nodeId: string, label: string) => DriveNode;
}

interface UseDrivePagedTreeChildrenReturn {
  childrenMap: Map<string, DriveNode[]>;
  pageStateMap: Map<string, DrivePagedTreePageState>;
  loadChildren: (nodeId: string, options?: { refresh?: boolean }) => Promise<DriveNode[]>;
  loadMoreChildren: (nodeId: string) => Promise<DriveNode[]>;
  reset: () => void;
}

const DEFAULT_COUNT_LOADED = (children: DriveNode[]): number =>
  children.filter((node) => node.type !== 'loading').length;

export function useDrivePagedTreeChildren({
  pageSize,
  loadPage,
  countLoaded = DEFAULT_COUNT_LOADED,
  buildLoadingPlaceholder = (nodeId, label) => buildLoadingNode(nodeId, label),
}: UseDrivePagedTreeChildrenParams): UseDrivePagedTreeChildrenReturn {
  const { t } = useTranslation('drive');
  const [childrenMap, setChildrenMap] = useState<Map<string, DriveNode[]>>(new Map());
  const [pageStateMap, setPageStateMap] = useState<Map<string, DrivePagedTreePageState>>(new Map());
  const loadingMoreNodeIdsRef = useRef<Set<string>>(new Set());

  const appendLoadMoreNode = (
    nodeId: string,
    children: DriveNode[],
    pageState: DrivePagedTreePageState
  ): DriveNode[] => {
    if (!pageState.hasMore) return children;
    return [
      ...children,
      buildLoadingPlaceholder(
        nodeId,
        t('node.loadMoreProgress', {
          loaded: countLoaded(children),
          total: pageState.total,
        })
      ),
    ];
  };

  const setNodeChildren = (nodeId: string, children: DriveNode[]) => {
    setChildrenMap((prev) => {
      const next = new Map(prev);
      next.set(nodeId, children);
      return next;
    });
  };

  const setNodePageState = (nodeId: string, pageState: DrivePagedTreePageState) => {
    setPageStateMap((prev) => {
      const next = new Map(prev);
      next.set(nodeId, pageState);
      return next;
    });
  };

  const toPageState = (result: DrivePagedTreePageResult): DrivePagedTreePageState => ({
    page: result.page,
    size: result.size,
    total: result.total,
    hasMore: result.hasMore,
  });

  const loadChildren = async (
    nodeId: string,
    options?: { refresh?: boolean }
  ): Promise<DriveNode[]> => {
    setNodeChildren(nodeId, [buildLoadingPlaceholder(nodeId, t('node.loading'))]);
    try {
      const result = await loadPage({
        nodeId,
        page: 1,
        size: pageSize,
        refresh: options?.refresh,
        mode: 'initial',
      });
      const pageState = toPageState(result);
      setNodePageState(nodeId, pageState);
      const children = appendLoadMoreNode(nodeId, result.nodes, pageState);
      setNodeChildren(nodeId, children);
      return children;
    } catch (err) {
      toast.danger(parseErrorMessage(err));
      setNodeChildren(nodeId, []);
      return [];
    }
  };

  const loadMoreChildren = async (nodeId: string): Promise<DriveNode[]> => {
    const pageState = pageStateMap.get(nodeId);
    const currentChildren = childrenMap.get(nodeId) ?? [];
    if (!pageState?.hasMore) return currentChildren;
    if (loadingMoreNodeIdsRef.current.has(nodeId)) return currentChildren;

    loadingMoreNodeIdsRef.current.add(nodeId);
    const stableChildren = currentChildren.filter((node) => node.type !== 'loading');
    setNodeChildren(nodeId, [
      ...stableChildren,
      buildLoadingPlaceholder(nodeId, t('node.loading')),
    ]);
    try {
      const result = await loadPage({
        nodeId,
        page: pageState.page + 1,
        size: pageState.size ?? pageSize,
        mode: 'more',
      });
      const nextPageState = toPageState(result);
      setNodePageState(nodeId, nextPageState);
      const nextChildren = appendLoadMoreNode(
        nodeId,
        [...stableChildren, ...result.nodes],
        nextPageState
      );
      setNodeChildren(nodeId, nextChildren);
      return nextChildren;
    } catch (err) {
      toast.danger(parseErrorMessage(err));
      setNodeChildren(nodeId, currentChildren);
      return currentChildren;
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
    pageStateMap,
    loadChildren,
    loadMoreChildren,
    reset,
  };
}
