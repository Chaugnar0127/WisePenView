import { useState } from 'react';

export interface UsePickerSelectionOptions<T> {
  initialValue: T;
  getCount: (value: T) => number;
}

/**
 * 统一资源选择类弹窗的选中态：维护选中值、选中数量和“是否可确认”。
 * 单选传 `T | undefined`，多选传 `T[]`；没有选中任何项时 canConfirm 为 false。
 */
export function usePickerSelection<T>({ initialValue, getCount }: UsePickerSelectionOptions<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const count = getCount(value);

  const clear = () => {
    setValue(initialValue);
  };

  return {
    canConfirm: count > 0,
    clear,
    count,
    setValue,
    value,
  };
}
