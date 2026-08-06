import { getGroupDisplayConfig } from '@/components/Group/GroupDisplayConfig';
import { GROUP_TYPE } from '@/domains/Group';
import { useAppRouteMeta } from '@/hooks/useAppRouteMeta';
import { useGroupContext } from '@/layouts/Group/GroupContext';
import {
  APP_ROUTE_PATH,
  buildCoursePath,
  buildGroupPath,
  type GroupRoutePage,
} from '@/utils/navigation/appRoute';
import { Button, Link, Tabs } from '@heroui/react';
import { linkVariants } from '@heroui/styles';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import layout from '../style.module.less';
import page from './style.module.less';

export interface GroupDetailOutletContextValue {
  walletRefreshVersion: number;
  refreshWallet: () => void;
}

const GROUP_PAGE_BY_KEY: Record<string, GroupRoutePage> = {
  'group.files': 'files',
  'group.members': 'members',
  'group.wallet': 'wallet',
  'group.tokenTransfer': 'token-transfer',
  'group.settings': 'settings',
};

function GroupDetail() {
  const { t } = useTranslation('group');
  const { group, currentUserRole } = useGroupContext();
  const routeMeta = useAppRouteMeta();
  const navigate = useNavigate();
  const [walletRefreshVersion, setWalletRefreshVersion] = useState(0);
  const displayConfig = getGroupDisplayConfig(group.groupType, currentUserRole);
  const activePage = GROUP_PAGE_BY_KEY[routeMeta?.pageKey ?? ''] ?? 'files';
  const tabs = [
    { key: 'files', label: t('detail.tabs.files') },
    { key: 'members', label: t('detail.tabs.members') },
    ...(displayConfig.showWalletTabs
      ? [
          { key: 'wallet' as const, label: t('detail.tabs.wallet') },
          { key: 'token-transfer' as const, label: t('detail.tabs.transfer') },
        ]
      : []),
    {
      key: 'settings' as const,
      label:
        group.groupType === GROUP_TYPE.ADVANCED
          ? t('detail.tabs.courseProfile')
          : t('detail.tabs.description'),
    },
  ] satisfies Array<{ key: GroupRoutePage; label: string }>;
  const containerClassName =
    activePage === 'files'
      ? `${layout.pageContainer} ${page.fixedPage}`
      : activePage === 'settings'
        ? `${layout.pageContainer} ${page.descriptionPage}`
        : layout.pageContainer;

  return (
    <div className={containerClassName}>
      <div className={`${layout.pageHeaderWithActions} ${page.detailHeader}`}>
        <div className={page.titleStack}>
          <Button variant="ghost" size="sm" onPress={() => navigate(APP_ROUTE_PATH.GROUPS)}>
            <ArrowLeft size={16} aria-hidden />
            {t('detail.backToGroups')}
          </Button>
          <h1 className={layout.pageTitle}>{group.groupName}</h1>
        </div>
        {group.groupType === GROUP_TYPE.ADVANCED ? (
          <RouterLink
            className={`${linkVariants().base()} ${page.contextLink}`}
            to={buildCoursePath(group.groupId, 'home')}
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
        selectedKey={activePage}
        onSelectionChange={(key) => {
          const nextPage = tabs.find((item) => item.key === String(key))?.key;
          if (nextPage) navigate(buildGroupPath(group.groupId, nextPage));
        }}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label={t('detail.aria')}>
            {tabs.map((item) => (
              <Tabs.Tab key={item.key} id={item.key}>
                {item.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className={page.tabContent}>
        <Outlet
          context={
            {
              walletRefreshVersion,
              refreshWallet: () => setWalletRefreshVersion((version) => version + 1),
            } satisfies GroupDetailOutletContextValue
          }
        />
      </div>
    </div>
  );
}

export default GroupDetail;
