import { ResultState, Spin } from '@/components/Feedback';
import { useGroupService } from '@/domains';
import type { Group, GroupResConfig } from '@/domains/Group';
import { GroupContext, type GroupCurrentUserRole } from '@/layouts/Group/GroupContext';
import { parseErrorMessage } from '@/utils/error';
import { Button } from '@heroui/react';
import { useRequest } from 'ahooks';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import styles from './style.module.less';

type GroupRouteLoaded = {
  group: Group;
  currentUserRole: GroupCurrentUserRole;
  groupResConfig: GroupResConfig;
};

function GroupRoute() {
  const { t } = useTranslation('group');
  const groupService = useGroupService();
  const navigate = useNavigate();
  const { groupId = '' } = useParams<{ groupId: string }>();
  const { data, loading, error, refresh } = useRequest(
    async (): Promise<GroupRouteLoaded> => {
      const [group, currentUserRole, groupResConfig] = await Promise.all([
        groupService.fetchGroupInfo(groupId),
        groupService.fetchMyRoleInGroup(groupId),
        groupService.fetchGroupResConfig(groupId),
      ]);
      return { group, currentUserRole, groupResConfig };
    },
    { ready: Boolean(groupId), refreshDeps: [groupId] }
  );

  if (loading) {
    return (
      <div className={styles.routeState}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.routeState}>
        <ResultState
          status="error"
          title={t('detail.loadFailed')}
          subTitle={error ? parseErrorMessage(error) : t('detail.notFound')}
          extra={
            <div className={styles.resultActions}>
              <Button variant="ghost" onPress={() => navigate('/app/collaboration')}>
                <ArrowLeft size={16} aria-hidden />
                {t('detail.backToGroups')}
              </Button>
              <Button variant="primary" onPress={refresh}>
                {t('detail.retry')}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <GroupContext.Provider
      value={{
        group: data.group,
        currentUserRole: data.currentUserRole,
        groupResConfig: data.groupResConfig,
        refreshGroup: refresh,
      }}
    >
      <Outlet />
    </GroupContext.Provider>
  );
}

export default GroupRoute;
