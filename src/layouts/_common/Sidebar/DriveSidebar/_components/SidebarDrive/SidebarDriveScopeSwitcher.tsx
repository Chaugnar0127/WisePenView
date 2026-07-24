import AppIconButton from '@/components/Button/AppIconButton';
import { AppPopover } from '@/components/Overlay';
import { useGroupService } from '@/domains';
import { buildDriveNodeScope } from '@/domains/Drive';
import type { Group } from '@/domains/Group';
import { useWorkspaceNavigationStore } from '@/layouts/Workspace/_store/useWorkspaceNavigationStore';
import { buildDrivePath } from '@/utils/navigation/driveRoute';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { Check, ChevronsUpDown, HardDrive, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import styles from './style.module.less';

const PERSONAL_SCOPE_KEY = '__personal__';
const GROUP_SCOPE_PAGE_SIZE = 100;

function SidebarDriveScopeSwitcher() {
  const { t } = useTranslation('drive');
  const groupService = useGroupService();
  const activeScope = useWorkspaceNavigationStore((state) => state.location.scope);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const selectedKey = activeScope.type === 'group' ? activeScope.groupId : PERSONAL_SCOPE_KEY;

  const { data: groups = [], loading } = useRequest(
    async (): Promise<Group[]> => {
      const [joinedGroups, managedGroups] = await Promise.all([
        groupService.fetchGroupList({
          groupRoleFilter: 'JOINED',
          page: 1,
          size: GROUP_SCOPE_PAGE_SIZE,
        }),
        groupService.fetchGroupList({
          groupRoleFilter: 'MANAGED',
          page: 1,
          size: GROUP_SCOPE_PAGE_SIZE,
        }),
      ]);
      return mergeScopeGroups([...joinedGroups.groups, ...managedGroups.groups]);
    },
    {
      onError: () => {
        toast.danger(t('sidebar.loadGroupsFailed'));
      },
    }
  );

  const handleSelectScope = (nextGroupId?: string): void => {
    navigate(buildDrivePath({ scope: buildDriveNodeScope(nextGroupId) }));
    setOpen(false);
  };

  return (
    <AppPopover isOpen={open} onOpenChange={setOpen}>
      <AppIconButton
        icon={<ChevronsUpDown size={14} aria-hidden="true" />}
        label={t('sidebar.switchScope')}
        size="sm"
        className={styles.nodeActionBtn}
        tooltip={{ content: t('sidebar.switchDrive') }}
        overlayTrigger={<AppPopover.Trigger />}
      />
      <AppPopover.Content placement="right" title={t('sidebar.switchDrive')}>
        <div
          className={styles.scopeMenuPanel}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div role="menu" aria-label={t('sidebar.switchScope')} className={styles.scopeList}>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={selectedKey === PERSONAL_SCOPE_KEY}
              className={styles.scopeMenuItem}
              onClick={() => handleSelectScope(undefined)}
            >
              <HardDrive size={15} aria-hidden="true" />
              <span className={styles.scopeMenuItemText}>{t('navigator.personalDrive')}</span>
              {selectedKey === PERSONAL_SCOPE_KEY ? (
                <Check size={14} className={styles.scopeCheckIcon} aria-hidden="true" />
              ) : null}
            </button>
            {groups.map((group) => (
              <button
                key={group.groupId}
                type="button"
                role="menuitemradio"
                aria-checked={selectedKey === group.groupId}
                className={styles.scopeMenuItem}
                onClick={() => handleSelectScope(group.groupId)}
              >
                <UsersRound size={15} aria-hidden="true" />
                <span className={styles.scopeMenuItemText}>
                  {group.groupName || t('navigator.unnamedGroup')}
                </span>
                {selectedKey === group.groupId ? (
                  <Check size={14} className={styles.scopeCheckIcon} aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
          {loading ? <div className={styles.scopeHint}>{t('sidebar.loadingGroups')}</div> : null}
          {!loading && groups.length === 0 ? (
            <div className={styles.scopeHint}>{t('sidebar.noGroups')}</div>
          ) : null}
        </div>
      </AppPopover.Content>
    </AppPopover>
  );
}

function mergeScopeGroups(groups: Group[]): Group[] {
  const groupMap = new Map<string, Group>();
  for (const group of groups) {
    if (!group.groupId || groupMap.has(group.groupId)) continue;
    groupMap.set(group.groupId, group);
  }
  return [...groupMap.values()];
}

export default SidebarDriveScopeSwitcher;
