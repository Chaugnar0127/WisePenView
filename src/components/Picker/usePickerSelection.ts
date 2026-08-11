import { useState } from 'react';

interface UsePickerSelectionOptions<T> {
  initialValue: T;
  getCount: (value: T) => number;
}

function usePickerSelection<T>({ initialValue, getCount }: UsePickerSelectionOptions<T>) {
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

export default usePickerSelection;
