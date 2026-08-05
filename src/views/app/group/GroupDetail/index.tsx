/**
 * 小组详情的展示和操作入口由组类型与当前用户角色配置驱动。
 */
import TableDrive from '@/components/Drive/TableDrive';
import { getGroupDisplayConfig } from '@/components/Group/GroupDisplayConfig';
import MemberList from '@/components/Group/MemberList';
import { GROUP_TYPE } from '@/domains/Group';
import { WALLET_TARGET_TYPE } from '@/domains/Wallet';
import { useGroupContext } from '@/layouts/Group/GroupContext';
import { parseDriveInitialNodeId } from '@/utils/navigation/driveRoute';
import ComputeWallet from '@/views/app/_common/Wallet/ComputeWallet';
import { Button, Link, Tabs } from '@heroui/react';
import { linkVariants } from '@heroui/styles';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import OwnerGroupTokenTransfer from '../_components/OwnerGroupTokenTransfer';
import layout from '../style.module.less';
import GroupDescriptionSettings from './_components/GroupDescriptionSettings';
import page from './style.module.less';

type GroupDetailTabKey = 'files' | 'members' | 'wallet' | 'token-transfer' | 'description';

type GroupDetailTabItem = {
  key: GroupDetailTabKey;
  label: string;
  disabled?: boolean;
  children: ReactNode;
};

function GroupDetail() {
  const { t } = useTranslation('group');
  const { group, currentUserRole, groupResConfig, refreshGroup } = useGroupContext();
  const navigate = useNavigate();
  const location = useLocation();
  const initialNodeId = parseDriveInitialNodeId(location.search);

  const groupDisplayConfig = getGroupDisplayConfig(group.groupType, currentUserRole);

  const [walletRefreshVersion, setWalletRefreshVersion] = useState(0);

  /** Tabs 受控，避免 items 更新时重置当前选中的 Tab */
  const [detailTabKey, setDetailTabKey] = useState<GroupDetailTabKey>('files');

  /**
   * Tab 配置必须在任意 early return 之前计算，以符合 Hooks 规则。
   * Tab 内容统一依赖 GroupRoute 注入的数据，后续拆分为子路由时可以继续复用同一上下文。
   */
  const tabItems = (() => {
    const gid = group.groupId;
    const items: GroupDetailTabItem[] = [
      {
        key: 'files',
        label: t('detail.tabs.files'),
        children: (
          <div className={`${layout.tabPane} ${page.fileTabPane}`}>
            <TableDrive
              scope={{ type: 'group', groupId: gid }}
              initialNodeId={initialNodeId}
              actions={{
                toolbar: {
                  canCreateFolder: groupDisplayConfig.canCreateTag,
                  canCreateNote: groupDisplayConfig.canCreateResource,
                  canCreateDrawio: groupDisplayConfig.canCreateResource,
                  canCreateSkill: groupDisplayConfig.canCreateResource,
                  canCreateAgent: groupDisplayConfig.canCreateResource,
                  canUploadToGroup: groupDisplayConfig.canUploadToGroup,
                  canManageTagPermission: groupDisplayConfig.canManageTag,
                },
              }}
            />
          </div>
        ),
      },
      {
        key: 'members',
        label: t('detail.tabs.members'),
        children: (
          <div className={layout.tabPane}>
            <MemberList
              groupDisplayConfig={groupDisplayConfig}
              groupId={gid}
              inviteCode={group.inviteCode}
              pagination={{
                defaultPageSize: 10,
                pageSizeOptions: [5, 10, 20, 50],
                showSizeChanger: true,
              }}
            />
          </div>
        ),
      },
    ];

    if (groupDisplayConfig.showWalletTabs) {
      items.push({
        key: 'wallet',
        label: t('detail.tabs.wallet'),
        children: (
          <div className={layout.tabPane}>
            <ComputeWallet
              targetType={WALLET_TARGET_TYPE.GROUP}
              targetId={gid}
              canRecharge={false}
              showOperatorColumn
              refreshVersion={walletRefreshVersion}
            />
          </div>
        ),
      });
      items.push({
        key: 'token-transfer',
        label: t('detail.tabs.transfer'),
        children: (
          <div className={layout.tabPane}>
            <OwnerGroupTokenTransfer
              groupId={gid}
              onTransferSuccess={() => {
                setWalletRefreshVersion((version) => version + 1);
              }}
            />
          </div>
        ),
      });
    }

    items.push({
      key: 'description',
      label:
        group.groupType === GROUP_TYPE.ADVANCED
          ? t('detail.tabs.courseProfile')
          : t('detail.tabs.description'),
      children: (
        <GroupDescriptionSettings
          key={gid}
          group={group}
          groupId={gid}
          groupResConfig={groupResConfig}
          currentUserRole={currentUserRole}
          onRefresh={refreshGroup}
        />
      ),
    });

    return items;
  })() satisfies GroupDetailTabItem[];

  const detailTabKeys = tabItems.map((item) => item.key);

  const handleDetailTabChange = (nextKey: GroupDetailTabKey) => {
    if (detailTabKeys.includes(nextKey)) {
      setDetailTabKey(nextKey);
    }
  };

  const activeDetailTabKey =
    detailTabKeys.length > 0 && !detailTabKeys.includes(detailTabKey)
      ? (detailTabKeys[0] ?? 'files')
      : detailTabKey;
  const activeTabContent = tabItems.find((item) => item.key === activeDetailTabKey)?.children;

  const { groupName } = group;

  return (
    <div
      className={
        activeDetailTabKey === 'files'
          ? `${layout.pageContainer} ${page.fixedPage}`
          : activeDetailTabKey === 'description'
            ? `${layout.pageContainer} ${page.descriptionPage}`
            : layout.pageContainer
      }
    >
      <div className={`${layout.pageHeaderWithActions} ${page.detailHeader}`}>
        <div className={page.titleStack}>
          <Button variant="ghost" size="sm" onPress={() => navigate('/app/collaboration')}>
            <ArrowLeft size={16} aria-hidden />
            {t('detail.backToGroups')}
          </Button>
          <h1 className={layout.pageTitle}>{groupName}</h1>
        </div>
        {group.groupType === GROUP_TYPE.ADVANCED ? (
          <RouterLink
            className={`${linkVariants().base()} ${page.contextLink}`}
            to={`/app/course/${group.groupId}/home`}
          >
            <Link.Icon className={`${linkVariants().icon()} ${page.contextLinkIcon}`}>
              <BookOpen aria-hidden />
            </Link.Icon>
            {t('detail.goToCourse')}
          </RouterLink>
        ) : null}
      </div>

      <Tabs
        variant="secondary"
        className={layout.detailTabs}
        selectedKey={activeDetailTabKey}
        onSelectionChange={(key) => {
          const nextKey = String(key);
          if (
            nextKey === 'files' ||
            nextKey === 'members' ||
            nextKey === 'wallet' ||
            nextKey === 'token-transfer' ||
            nextKey === 'description'
          ) {
            handleDetailTabChange(nextKey);
          }
        }}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('detail.aria')}>
            {tabItems.map((item) => (
              <Tabs.Tab key={item.key} id={item.key} isDisabled={item.disabled}>
                {item.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div className={page.tabContent}>{activeTabContent}</div>
    </div>
  );
}

export default GroupDetail;
