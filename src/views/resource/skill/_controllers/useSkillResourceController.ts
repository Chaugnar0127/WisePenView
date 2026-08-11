import { useInteractService, useSkillService } from '@/domains';
import { useApi } from '@/hooks/useApi';

export function useSkillResourceController(resourceId: string) {
  const skillService = useSkillService();
  const interactService = useInteractService();

  const {
    data: skill,
    loading,
    error,
    refresh: refreshSkill,
  } = useApi(() => skillService.getSkillDetail(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
  });

  useApi(() => interactService.recordResourceRead(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
  });

  return {
    error,
    loading,
    refreshSkill,
    skill,
  };
}
