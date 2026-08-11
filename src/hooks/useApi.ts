import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import useInfiniteScroll from 'ahooks/es/useInfiniteScroll';
import type {
  InfiniteScrollOptions,
  Data as UseInfiniteScrollData,
  Service as UseInfiniteScrollService,
} from 'ahooks/es/useInfiniteScroll/types';
import usePagination from 'ahooks/es/usePagination';
import type {
  PaginationOptions,
  PaginationResult,
  Data as UsePaginationData,
  Params as UsePaginationParams,
  Service as UsePaginationService,
} from 'ahooks/es/usePagination/types';
import useRequest from 'ahooks/es/useRequest';
import type {
  Options as UseRequestOptions,
  Result as UseRequestResult,
  Service as UseRequestService,
} from 'ahooks/es/useRequest/src/types';

interface UseApiErrorOptions<TParams extends unknown[]> {
  getErrorMessage?: (error: Error, params: TParams) => string;
  onErrorEffect?: (error: Error, params: TParams) => void;
  showErrorToast?: boolean;
}

type UseApiOptions<TData, TParams extends unknown[]> = UseRequestOptions<TData, TParams> &
  UseApiErrorOptions<TParams>;

type UseApiPaginationOptions<
  TData extends UsePaginationData,
  TParams extends UsePaginationParams,
> = PaginationOptions<TData, TParams> & UseApiErrorOptions<TParams>;

type UseApiInfiniteScrollOptions<TData extends UseInfiniteScrollData> =
  InfiniteScrollOptions<TData> & UseApiErrorOptions<[]>;

type UseApiResult<TData, TParams extends unknown[]> = UseRequestResult<TData, TParams> & {
  empty: boolean;
  hasError: boolean;
  loaded: boolean;
};

const isApiDataEmpty = <TData>(data: TData | undefined): boolean => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
};

const notifyApiError = <TParams extends unknown[]>(
  error: Error,
  params: TParams,
  options: UseApiErrorOptions<TParams>
): void => {
  const { getErrorMessage, onErrorEffect, showErrorToast = true } = options;
  if (showErrorToast) {
    toast.danger(getErrorMessage ? getErrorMessage(error, params) : parseErrorMessage(error));
  }
  onErrorEffect?.(error, params);
};

export function useApi<TData, TParams extends unknown[]>(
  service: UseRequestService<TData, TParams>,
  options: UseApiOptions<TData, TParams> = {}
): UseApiResult<TData, TParams> {
  const {
    getErrorMessage,
    onError,
    onErrorEffect,
    showErrorToast = true,
    ...restOptions
  } = options;
  const request = useRequest<TData, TParams>(service, {
    ...restOptions,
    onError:
      onError ??
      ((error, params) =>
        notifyApiError(error, params, { getErrorMessage, onErrorEffect, showErrorToast })),
  });

  return {
    ...request,
    empty: !request.loading && !request.error && isApiDataEmpty(request.data),
    hasError: Boolean(request.error),
    loaded: !request.loading && !request.error && request.data !== undefined,
  };
}

export function useApiPagination<
  TData extends UsePaginationData,
  TParams extends UsePaginationParams,
>(
  service: UsePaginationService<TData, TParams>,
  options: UseApiPaginationOptions<TData, TParams> = {}
): PaginationResult<TData, TParams> {
  const {
    getErrorMessage,
    onError,
    onErrorEffect,
    showErrorToast = true,
    ...restOptions
  } = options;
  return usePagination<TData, TParams>(service, {
    ...restOptions,
    onError:
      onError ??
      ((error, params) =>
        notifyApiError(error, params, { getErrorMessage, onErrorEffect, showErrorToast })),
  });
}

export function useApiInfiniteScroll<TData extends UseInfiniteScrollData>(
  service: UseInfiniteScrollService<TData>,
  options: UseApiInfiniteScrollOptions<TData> = {}
) {
  const {
    getErrorMessage,
    onError,
    onErrorEffect,
    showErrorToast = true,
    ...restOptions
  } = options;
  return useInfiniteScroll<TData>(service, {
    ...restOptions,
    onError:
      onError ??
      ((error) => notifyApiError(error, [], { getErrorMessage, onErrorEffect, showErrorToast })),
  });
}
