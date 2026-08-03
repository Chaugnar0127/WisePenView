import type { ReactNode } from 'react';

export interface PieChartItem {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  items: PieChartItem[];
  ariaLabel: string;
  variant?: 'card' | 'section';
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  targetValue?: number;
  unallocatedLabel?: string;
  emptyLabel?: string;
  valueFormatter?: (value: number) => ReactNode;
  className?: string;
}
