import {
  areResourcePermissionActionsEqualByOptions,
  filterResourcePermissionActionsByOptions,
} from '@/components/Drive/common/resourcePermissionPolicy';
import type { GroupBaseInfo } from '@/domains/Group';
import type {
  ResourceAction,
  ResourcePermissionActionOption,
  ResourcePermissionSubject,
} from '@/domains/Resource';
import type { UserSearchUser } from '@/domains/User';
import type { TFunction } from 'i18next';

export type SpecifiedUserCandidate = Pick<
  UserSearchUser,
  'userId' | 'username' | 'nickname' | 'realName' | 'avatar'
>;

export const getSupportedActionsFromOptions = (
  actionOptions: ResourcePermissionActionOption[]
): ResourceAction[] =>
  actionOptions.filter((option) => option.supported).map((option) => option.action);

export const getAvatarSrc = (avatar?: string): string | undefined => {
  const trimmedAvatar = avatar?.trim();
  return trimmedAvatar || undefined;
};

export const getUserCandidateDisplayName = (
  user: SpecifiedUserCandidate,
  t: TFunction<'resource'>
): string =>
  user.realName?.trim() ||
  user.nickname?.trim() ||
  user.username.trim() ||
  t('permission.userFallback', { userId: user.userId });

export const getSubjectActionsForDisplay = (
  subject: ResourcePermissionSubject
): ResourceAction[] => {
  if (subject.source === 'tag') {
    return subject.inheritedActions ?? subject.effectiveActions;
  }
  return subject.readonly ? subject.effectiveActions : subject.editableActions;
};

export const getSubjectRenderKey = (subject: ResourcePermissionSubject): string => {
  if (subject.groupId) return `group:${subject.groupId}`;
  if (subject.userId) return `user:${subject.userId}:${subject.source}`;
  return subject.id;
};

export const updateSubjectActions = (
  subjects: ResourcePermissionSubject[],
  subjectId: string,
  actions: ResourcePermissionActionOption['action'][],
  options: ResourcePermissionActionOption[]
): ResourcePermissionSubject[] =>
  subjects.map((subject) => {
    if (subject.id !== subjectId || subject.readonly) return subject;
    const nextActions = filterResourcePermissionActionsByOptions(actions, options);
    if (
      subject.source === 'resourceOverride' &&
      Array.isArray(subject.inheritedActions) &&
      areResourcePermissionActionsEqualByOptions(nextActions, subject.inheritedActions, options)
    ) {
      const inheritedActions = filterResourcePermissionActionsByOptions(
        subject.inheritedActions,
        options
      );
      return {
        ...subject,
        id: subject.groupId ? `group:${subject.groupId}:tag` : subject.id,
        source: 'tag',
        description: '',
        editableActions: inheritedActions,
        effectiveActions: inheritedActions,
        inheritedActions,
      };
    }
    if (subject.source === 'tag') {
      return {
        ...subject,
        id: subject.groupId ? `group:${subject.groupId}:override` : `${subject.id}:override`,
        source: 'resourceOverride',
        description: '',
        editableActions: nextActions,
        effectiveActions: nextActions,
      };
    }
    return {
      ...subject,
      editableActions: nextActions,
      effectiveActions: nextActions,
    };
  });

export const createSpecifiedUserSubject = (
  user: SpecifiedUserCandidate,
  t: TFunction<'resource'>
): ResourcePermissionSubject => ({
  id: `user:${user.userId}:specified`,
  kind: 'user',
  source: 'specifiedUser',
  name: getUserCandidateDisplayName(user, t),
  description: '',
  avatar: getAvatarSrc(user.avatar),
  userId: user.userId,
  effectiveActions: [],
  editableActions: [],
});

export const hydrateUserDisplayInfo = (
  subjects: ResourcePermissionSubject[],
  userInfoById: Map<string, SpecifiedUserCandidate>,
  t: TFunction<'resource'>
): ResourcePermissionSubject[] => {
  let changed = false;
  const nextSubjects = subjects.map((subject) => {
    if (!subject.userId) return subject;
    const userInfo = userInfoById.get(subject.userId);
    if (!userInfo) return subject;

    const nextName = getUserCandidateDisplayName(userInfo, t);
    const nextAvatar = getAvatarSrc(userInfo.avatar) || getAvatarSrc(subject.avatar);
    if (subject.name === nextName && subject.avatar === nextAvatar) {
      return subject;
    }

    changed = true;
    return {
      ...subject,
      name: nextName,
      avatar: nextAvatar,
    };
  });

  return changed ? nextSubjects : subjects;
};

export const hydrateGroupDisplayInfo = (
  subjects: ResourcePermissionSubject[],
  groupInfoById: Map<string, GroupBaseInfo>,
  t: TFunction<'resource'>
): ResourcePermissionSubject[] => {
  let changed = false;
  const nextSubjects = subjects.map((subject) => {
    if (!subject.groupId) return subject;
    const groupInfo = groupInfoById.get(subject.groupId);
    if (!groupInfo) return subject;

    const groupName = groupInfo.groupName.trim();
    const groupDesc = groupInfo.groupDesc.trim();
    const groupCoverUrl = groupInfo.groupCoverUrl.trim();
    const nextName = groupName ? t('permission.groupMembers', { groupName }) : subject.name;
    const nextDescription =
      subject.source === 'resourceOverride' && groupDesc ? groupDesc : subject.description;
    const nextAvatar = groupCoverUrl || getAvatarSrc(subject.avatar);

    if (
      subject.name === nextName &&
      subject.description === nextDescription &&
      subject.avatar === nextAvatar
    ) {
      return subject;
    }

    changed = true;
    return {
      ...subject,
      name: nextName,
      description: nextDescription,
      avatar: nextAvatar,
    };
  });

  return changed ? nextSubjects : subjects;
};

export const hydrateInheritedTagActions = (
  subjects: ResourcePermissionSubject[],
  options: ResourcePermissionActionOption[],
  getInheritedActions: (subject: ResourcePermissionSubject) => ResourceAction[] | undefined
): ResourcePermissionSubject[] =>
  subjects.map((subject) => {
    if (!subject.groupId || !subject.primaryTagId) return subject;
    const inheritedActions = getInheritedActions(subject);
    if (!inheritedActions) return subject;
    const normalizedInheritedActions = filterResourcePermissionActionsByOptions(
      inheritedActions,
      options
    );

    if (subject.source === 'resourceOverride') {
      const matchesTag = areResourcePermissionActionsEqualByOptions(
        subject.editableActions,
        normalizedInheritedActions,
        options
      );
      if (matchesTag) {
        return {
          ...subject,
          id: `group:${subject.groupId}:tag`,
          source: 'tag',
          description: '',
          editableActions: normalizedInheritedActions,
          effectiveActions: normalizedInheritedActions,
          inheritedActions: normalizedInheritedActions,
        };
      }
    }

    if (subject.source === 'tag') {
      return {
        ...subject,
        description: '',
        editableActions: normalizedInheritedActions,
        effectiveActions: normalizedInheritedActions,
        inheritedActions: normalizedInheritedActions,
      };
    }

    return {
      ...subject,
      inheritedActions: normalizedInheritedActions,
    };
  });
