import { useGroupService, useResourceService, useTagService, useUserService } from '@/domains';
import type { GroupBaseInfo } from '@/domains/Group';
import {
  type ResourcePermissionActionOption,
  type ResourcePermissionOverview,
  type ResourcePermissionSubject,
  updateResourceActionSelection,
} from '@/domains/Resource';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResourcePermissionPanelProps } from './index.type';
import {
  createSpecifiedUserSubject,
  getSubjectActionsForDisplay,
  getSupportedActionsFromOptions,
  hydrateGroupDisplayInfo,
  hydrateInheritedTagActions,
  hydrateUserDisplayInfo,
  localizePermissionActionOptions,
  type SpecifiedUserCandidate,
  updateSubjectActions,
} from './resourcePermissionPanelModel';

const EMPTY_ACTION_OPTIONS: ResourcePermissionActionOption[] = [];

export const useResourcePermissionPanelController = ({
  resourceId,
  resourceType,
  onSuccess,
}: ResourcePermissionPanelProps) => {
  const { t } = useTranslation('resource');
  const groupService = useGroupService();
  const resourceService = useResourceService();
  const tagService = useTagService();
  const userService = useUserService();
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestSubjectsRef = useRef<ResourcePermissionSubject[]>([]);
  const [subjectDrafts, setSubjectDrafts] = useState<ResourcePermissionSubject[] | null>(null);
  const [newUserKeyword, setNewUserKeyword] = useState('');
  const [pendingUpdateCount, setPendingUpdateCount] = useState(0);
  const {
    data: permissionOverview,
    loading,
    error,
    refresh: refreshPermissionOverview,
  } = useRequest(
    () => resourceService.getResourcePermissionOverview({ resourceId, resourceType }),
    {
      ready: Boolean(resourceId && resourceType),
      refreshDeps: [resourceId, resourceType],
      onSuccess: (overview: ResourcePermissionOverview) => {
        latestSubjectsRef.current = overview.subjects;
        setSubjectDrafts(overview.subjects);
      },
    }
  );
  const subjects = subjectDrafts ?? permissionOverview?.subjects ?? [];
  const actionOptions = localizePermissionActionOptions(
    permissionOverview?.actionOptions ?? EMPTY_ACTION_OPTIONS
  );
  const inheritedSubjects = subjects.filter((subject) => subject.source !== 'specifiedUser');
  const specifiedUserSubjects = subjects.filter((subject) => subject.source === 'specifiedUser');
  const existingSpecifiedUserIds = new Set(
    specifiedUserSubjects
      .map((subject) => subject.userId)
      .filter((userId): userId is string => Boolean(userId))
  );

  useRequest(
    async () => {
      if (!permissionOverview) return;
      const userSubjects = permissionOverview.subjects.filter(
        (subject) => subject.userId && subject.kind !== 'group'
      );
      if (userSubjects.length === 0) return;

      const userInfoById = new Map<string, SpecifiedUserCandidate>();
      const ownerIds = new Set(
        userSubjects
          .filter((subject) => subject.source === 'owner')
          .map((subject) => subject.userId)
          .filter((userId): userId is string => Boolean(userId))
      );

      if (ownerIds.size > 0) {
        const currentUser = await userService.getUserInfo().catch(() => undefined);
        if (currentUser && ownerIds.has(currentUser.id)) {
          userInfoById.set(currentUser.id, {
            userId: currentUser.id,
            username: currentUser.username,
            nickname: currentUser.nickname,
            realName: currentUser.realName,
            avatar: currentUser.avatar,
          });
        }
      }

      await Promise.all(
        userSubjects
          .filter((subject) => subject.source !== 'owner' && subject.userId)
          .map(async (subject) => {
            const userId = subject.userId;
            if (!userId || userInfoById.has(userId)) return;
            const keywords = Array.from(
              new Set([userId, subject.name].map((keyword) => keyword.trim()).filter(Boolean))
            );
            for (const keyword of keywords) {
              const candidates = await userService
                .queryUserSearchCandidates({ keyword, size: 6 })
                .catch(() => []);
              const matchedUser = candidates.find((user) => user.userId === userId);
              if (matchedUser) {
                userInfoById.set(userId, matchedUser);
                return;
              }
            }
          })
      );

      if (userInfoById.size === 0) return;
      setSubjectDrafts((currentSubjects) => {
        const baseSubjects = currentSubjects ?? permissionOverview.subjects;
        const nextSubjects = hydrateUserDisplayInfo(baseSubjects, userInfoById, t);
        latestSubjectsRef.current = nextSubjects;
        return nextSubjects;
      });
    },
    {
      ready: Boolean(permissionOverview),
      refreshDeps: [permissionOverview, userService, t],
    }
  );

  useRequest(
    async () => {
      if (!permissionOverview) return;
      const groupIds = Array.from(
        new Set(
          permissionOverview.subjects
            .map((subject) => subject.groupId)
            .filter((groupId): groupId is string => Boolean(groupId))
        )
      );
      if (groupIds.length === 0) return;

      const groupInfos = await Promise.all(
        groupIds.map((groupId) => groupService.fetchGroupBaseInfo(groupId).catch(() => undefined))
      );
      const groupInfoById = new Map(
        groupInfos
          .filter((groupInfo): groupInfo is GroupBaseInfo => Boolean(groupInfo?.groupId))
          .map((groupInfo) => [groupInfo.groupId, groupInfo])
      );
      if (groupInfoById.size === 0) return;

      setSubjectDrafts((currentSubjects) => {
        const baseSubjects = currentSubjects ?? permissionOverview.subjects;
        const nextSubjects = hydrateGroupDisplayInfo(baseSubjects, groupInfoById, t);
        latestSubjectsRef.current = nextSubjects;
        return nextSubjects;
      });
    },
    {
      ready: Boolean(permissionOverview),
      refreshDeps: [permissionOverview, groupService, t],
    }
  );

  useRequest(
    async () => {
      if (!permissionOverview || permissionOverview.actionOptions.length === 0) return;
      const inheritedActionOptions = localizePermissionActionOptions(
        permissionOverview.actionOptions
      );
      const groupIds = Array.from(
        new Set(
          permissionOverview.subjects
            .map((subject) => subject.groupId)
            .filter((groupId): groupId is string => Boolean(groupId))
        )
      );
      if (groupIds.length === 0) return;

      await Promise.all(
        groupIds.map((groupId) => tagService.getRawTagTree(groupId).catch(() => []))
      );
      setSubjectDrafts((currentSubjects) => {
        const baseSubjects = currentSubjects ?? permissionOverview.subjects;
        const nextSubjects = hydrateInheritedTagActions(
          baseSubjects,
          inheritedActionOptions,
          (subject) =>
            subject.primaryTagId
              ? tagService.getRawTagById(subject.primaryTagId, subject.groupId)?.grantedActions
              : undefined
        );
        latestSubjectsRef.current = nextSubjects;
        return nextSubjects;
      });
    },
    {
      ready: Boolean(permissionOverview?.actionOptions.length),
      refreshDeps: [permissionOverview, tagService],
    }
  );

  const persistPermissionSubjects = (nextSubjects: ResourcePermissionSubject[]) => {
    setPendingUpdateCount((count) => count + 1);
    updateQueueRef.current = updateQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await resourceService.updateResourcePermissionSubjects({
          resourceId,
          subjects: nextSubjects,
        });
        onSuccess?.();
      })
      .catch((err) => {
        toast.danger(parseErrorMessage(err));
        refreshPermissionOverview();
      })
      .finally(() => {
        setPendingUpdateCount((count) => Math.max(0, count - 1));
      });
  };

  const commitSubjectDrafts = (nextSubjects: ResourcePermissionSubject[]) => {
    latestSubjectsRef.current = nextSubjects;
    setSubjectDrafts(nextSubjects);
    persistPermissionSubjects(nextSubjects);
  };

  const handleActionToggle = (
    changedSubject: ResourcePermissionSubject,
    action: ResourcePermissionActionOption['action']
  ) => {
    const currentSubjects = latestSubjectsRef.current;
    const currentSelectedSubject = currentSubjects.find(
      (subject) => subject.id === changedSubject.id
    );
    if (!currentSelectedSubject || currentSelectedSubject.readonly) return;
    const currentActions = getSubjectActionsForDisplay(currentSelectedSubject);
    const nextActions = updateResourceActionSelection(
      currentActions,
      action,
      !currentActions.includes(action),
      getSupportedActionsFromOptions(actionOptions)
    );
    const nextSubjects = updateSubjectActions(
      currentSubjects,
      currentSelectedSubject.id,
      nextActions,
      actionOptions
    );
    commitSubjectDrafts(nextSubjects);
  };

  const addSpecifiedUserCandidate = (user: SpecifiedUserCandidate) => {
    const currentSubjects = latestSubjectsRef.current;
    const userId = user.userId.trim();
    if (!userId) {
      toast.warning(t('permission.feedback.invalidUser'));
      return;
    }
    if (currentSubjects.some((subject) => subject.userId === userId)) {
      toast.warning(t('permission.feedback.duplicateUser'));
      return;
    }
    const nextSubject = createSpecifiedUserSubject({ ...user, userId }, t);
    commitSubjectDrafts([...currentSubjects, nextSubject]);
    setNewUserKeyword('');
  };

  const handleUserSearchEmpty = () => {
    const keyword = newUserKeyword.trim();
    toast.warning(
      keyword ? t('permission.feedback.userNotFound') : t('permission.feedback.userRequired')
    );
  };

  const handleUserSearchError = (err: unknown) => {
    toast.danger(parseErrorMessage(err));
  };

  const handleRemoveSpecifiedUser = (subject: ResourcePermissionSubject) => {
    if (subject.source !== 'specifiedUser') return;
    const nextSubjects = latestSubjectsRef.current.filter(
      (currentSubject) => currentSubject.id !== subject.id
    );
    commitSubjectDrafts(nextSubjects);
  };

  const queryUserCandidates = (keyword: string) =>
    userService.queryUserSearchCandidates({ keyword, size: 6 });

  return {
    actionOptions,
    addSpecifiedUserCandidate,
    error,
    existingSpecifiedUserIds,
    handleActionToggle,
    handleRemoveSpecifiedUser,
    handleUserSearchEmpty,
    handleUserSearchError,
    inheritedSubjects,
    isUpdating: pendingUpdateCount > 0,
    loading,
    newUserKeyword,
    permissionOverview,
    queryUserCandidates,
    setNewUserKeyword,
    shouldShowInviteDivider: inheritedSubjects.length > 0 && specifiedUserSubjects.length > 0,
    specifiedUserSubjects,
  };
};
