import type { CourseOutlineNode, CourseOutlineResourceNode } from '@/domains/Course';

export const findOutlineNode = (
  nodes: CourseOutlineNode[],
  nodeId: string
): CourseOutlineNode | undefined => {
  for (const node of nodes) {
    if (node.nodeId === nodeId) return node;
    if (node.nodeType !== 'RESOURCE') {
      const child = findOutlineNode(node.children, nodeId);
      if (child) return child;
    }
  }
  return undefined;
};

export const collectOutlineResources = (
  nodes: CourseOutlineNode[]
): CourseOutlineResourceNode[] => {
  const resources: CourseOutlineResourceNode[] = [];
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') resources.push(node);
    else resources.push(...collectOutlineResources(node.children));
  }
  return resources;
};

export const findOutlineResourceByResourceId = (
  nodes: CourseOutlineNode[],
  resourceId: string
): CourseOutlineResourceNode | undefined => {
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') {
      if (node.resourceId === resourceId) return node;
      continue;
    }
    const child = findOutlineResourceByResourceId(node.children, resourceId);
    if (child) return child;
  }
  return undefined;
};

export const filterCourseOutline = (
  nodes: CourseOutlineNode[],
  normalizedQuery: string
): CourseOutlineNode[] => {
  if (!normalizedQuery) return nodes;
  const filtered: CourseOutlineNode[] = [];
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') {
      if (node.title.toLocaleLowerCase().includes(normalizedQuery)) filtered.push(node);
      continue;
    }
    const children = filterCourseOutline(node.children, normalizedQuery);
    if (node.title.toLocaleLowerCase().includes(normalizedQuery) || children.length > 0) {
      filtered.push({ ...node, children });
    }
  }
  return filtered;
};
