import type { FolderTableRow } from '@/components/Table';
import type { CourseOutlineEditorNode } from '@/domains/Course';

export interface OutlineRow extends FolderTableRow {
  nodeId: string;
  resourceId?: string;
  parentId?: string;
}

export const mapCourseOutlineRows = (nodes: CourseOutlineEditorNode[]): OutlineRow[] =>
  nodes.map((node) => ({
    id: node.nodeId,
    nodeId: node.nodeId,
    resourceId: node.resourceId,
    parentId: node.parentId,
    name: node.name,
    entryType: node.entryType,
    resourceType: node.resourceType,
    typeLabel: node.entryType === 'folder' ? '章节' : (node.resourceType ?? '资源'),
    isExpandable: node.entryType === 'folder' && Boolean(node.children?.length),
    children: node.children ? mapCourseOutlineRows(node.children) : undefined,
  }));

export const collectCourseOutlineFolders = (rows: OutlineRow[]): OutlineRow[] =>
  rows.flatMap((row) => [
    ...(row.entryType === 'folder' ? [row] : []),
    ...collectCourseOutlineFolders((row.children ?? []) as OutlineRow[]),
  ]);

export const findCourseOutlineFolderSiblings = (
  rows: OutlineRow[],
  row: OutlineRow
): OutlineRow[] | undefined => {
  const folderRows = rows.filter((item) => item.entryType === 'folder');
  if (folderRows.some((item) => item.nodeId === row.nodeId)) return folderRows;
  for (const item of folderRows) {
    const siblings = findCourseOutlineFolderSiblings((item.children ?? []) as OutlineRow[], row);
    if (siblings) return siblings;
  }
  return undefined;
};
