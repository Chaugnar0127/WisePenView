import { useCourseService } from '@/domains';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { collectCourseOutlineFolders, mapCourseOutlineRows, type OutlineRow } from '../model';

export const useCourseOutlineNavigationController = (courseId: string) => {
  const courseService = useCourseService();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<OutlineRow>();
  const request = useRequest(() => courseService.getCourseOutlineEditor(courseId));
  const rows = mapCourseOutlineRows(request.data ?? []);
  const folderRows = collectCourseOutlineFolders(rows);
  const selectedFolder = selectedRow?.entryType === 'folder' ? selectedRow : undefined;

  return {
    rows,
    folderRows,
    selectedRow,
    selectedFolder,
    expandedKeys,
    loading: request.loading,
    refresh: request.refresh,
    selectRow: setSelectedRow,
    clearSelection: () => setSelectedRow(undefined),
    setExpandedKeys,
  };
};
