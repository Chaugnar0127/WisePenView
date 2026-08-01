import { TableSortColumnLabel } from './index';
import type { TableSortColumnLabelProps } from './index.type';

export function renderSortableColumnLabel(
  label: TableSortColumnLabelProps['label'],
  sortDirection: TableSortColumnLabelProps['sortDirection'],
  allowsSorting?: boolean,
  align?: TableSortColumnLabelProps['align']
) {
  if (!allowsSorting) {
    return label;
  }
  return <TableSortColumnLabel label={label} sortDirection={sortDirection} align={align} />;
}
