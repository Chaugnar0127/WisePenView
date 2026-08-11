import { useInteractService } from '@/domains';
import { useApi } from '@/hooks/useApi';

export function useFavoriteCollections() {
  const interactService = useInteractService();
  const { data, loading, refresh } = useApi(() => interactService.listFavoriteCollections(), {});

  return {
    collections: data ?? [],
    hasLoaded: data !== undefined,
    loading,
    refresh,
  };
}
