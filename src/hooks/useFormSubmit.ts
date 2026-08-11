import type { FormEvent } from 'react';

import { useApi } from './useApi';

interface UseFormSubmitOptions {
  validate?: () => boolean;
  onSubmit: () => void | Promise<void>;
}

function useFormSubmit({ validate, onSubmit }: UseFormSubmitOptions) {
  const request = useApi(
    async () => {
      await onSubmit();
    },
    { manual: true }
  );

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (request.loading) return;
    if (validate && !validate()) return;
    request.run();
  };

  return {
    handleSubmit,
    loading: request.loading,
  };
}

export default useFormSubmit;
