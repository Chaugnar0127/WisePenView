import AppIconButton from '@/components/Button/AppIconButton';
import { AppPopover } from '@/components/Overlay';
import { useGroupService } from '@/domains';
import { buildDriveNodeScope } from '@/domains/Drive';
import type { Group } from '@/domains/Group';
import { useApi } from '@/hooks/useApi';
import { useSidebarDriveScopeStore } from '@/layouts/_common/Sidebar/DriveSidebar/_store/useSidebarDriveScopeStore';
import { Check, ChevronsUpDown, HardDrive, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './style.module.less';

const PERSONAL_SCOPE_KEY = '__personal__';
const GROUP_SCOPE_PAGE_SIZE = 20;

function SidebarDriveScopeSwitcher() {
  const { t } = useTranslation('drive');
  const groupService = useGroupService();
  const activeScope = useSidebarDriveScopeStore((state) => state.scope);
  const setScope = useSidebarDriveScopeStore((state) => state.setScope);
  const [open, setOpen] = useState(false);
  const [groupPage, setGroupPage] = useState(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupTotalPage, setGroupTotalPage] = useState(1);
  const selectedKey = activeScope.type === 'group' ? activeScope.groupId : PERSONAL_SCOPE_KEY;

  const { loading } = useApi(
    () =>
      groupService.fetchGroupList({
        groupRoleFilter: 'ALL',
        page: groupPage,
        size: GROUP_SCOPE_PAGE_SIZE,
      }),
    {
      refreshDeps: [groupPage],
      onSuccess: (result) => {
        setGroups((current) =>
          result.page === 1 ? result.groups : [...current, ...result.groups]
        );
        setGroupTotalPage(result.totalPage);
      },
      getErrorMessage: () => t('sidebar.loadGroupsFailed'),
    }
  );
  const hasMoreGroups = groupPage < groupTotalPage;

  const handleSelectScope = (nextGroupId?: string): void => {
    setScope(buildDriveNodeScope(nextGroupId));
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
          {hasMoreGroups ? (
            <button
              type="button"
              className={styles.scopeLoadMoreButton}
              onClick={() => setGroupPage((page) => page + 1)}
              disabled={loading}
            >
              {loading ? t('sidebar.loadingGroups') : t('sidebar.loadMoreGroups')}
            </button>
          ) : null}
          {loading ? <div className={styles.scopeHint}>{t('sidebar.loadingGroups')}</div> : null}
          {!loading && groups.length === 0 ? (
            <div className={styles.scopeHint}>{t('sidebar.noGroups')}</div>
          ) : null}
        </div>
      </AppPopover.Content>
    </AppPopover>
  );
}

export default SidebarDriveScopeSwitcher;
