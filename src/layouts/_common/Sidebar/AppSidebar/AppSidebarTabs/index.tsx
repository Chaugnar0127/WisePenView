import { useChatSessionHistoryRefreshStore } from '@/components/ChatPanel/_store/useChatSessionHistoryRefreshStore';
import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import {
  APP_HEADER_NAV_KEY,
  resolveAppHeaderNavKey,
} from '@/layouts/_common/Sidebar/appSidebarNavigation';
import SidebarDrive from '@/layouts/_common/Sidebar/DriveSidebar/_components/SidebarDrive';
import CommandPaletteTrigger from '@/layouts/AppNavigation/CommandPaletteTrigger';
import { Tabs, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { FolderOpen, MessageSquare, type LucideIcon } from 'lucide-react';
import { useState, type Key } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SessionListGroup from '../SessionListGroup';
import styles from './style.module.less';

const SIDEBAR_TAB = {
  SESSIONS: 'session-history',
  DRIVE: 'drive',
} as const;

type SidebarTabKey = (typeof SIDEBAR_TAB)[keyof typeof SIDEBAR_TAB];

interface SidebarViewTabProps {
  id: SidebarTabKey;
  label: string;
  icon: LucideIcon;
  selected: boolean;
}

function SidebarViewTab({ id, label, icon: Icon, selected }: SidebarViewTabProps) {
  return (
    <Tabs.Tab id={id} className={styles.tab} aria-label={label}>
      <Tooltip isDisabled={selected}>
        <Tooltip.Trigger className={styles.tabTooltipTrigger}>
          <span className={styles.tabContent}>
            <Icon size={18} aria-hidden="true" />
            <span className={styles.tabLabel}>
              <span className={styles.tabLabelInner}>{label}</span>
            </span>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content placement="bottom">{label}</Tooltip.Content>
      </Tooltip>
    </Tabs.Tab>
  );
}

function AppSidebarTabs() {
  const { t } = useTranslation('shell');
  const location = useLocation();
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const refreshVersion = useChatSessionHistoryRefreshStore((state) => state.refreshVersion);
  const activeNavKey = resolveAppHeaderNavKey(location.pathname);
  // 独立于上方路由导航：仅本处 Tabs 切换
  const [selectedTab, setSelectedTab] = useState<SidebarTabKey>(() =>
    activeNavKey === APP_HEADER_NAV_KEY.CHAT ? SIDEBAR_TAB.SESSIONS : SIDEBAR_TAB.DRIVE
  );

  const selectedKeys =
    activeNavKey === APP_HEADER_NAV_KEY.CHAT && currentSessionId
      ? [`session-${currentSessionId}`]
      : [];

  const handleTabChange = (key: Key) => {
    const nextTab = String(key);
    if (nextTab === SIDEBAR_TAB.SESSIONS || nextTab === SIDEBAR_TAB.DRIVE) {
      setSelectedTab(nextTab);
    }
  };

  return (
    <div className={styles.menuContainer}>
      <Tabs className={styles.tabs} selectedKey={selectedTab} onSelectionChange={handleTabChange}>
        <Tabs.ListContainer className={styles.tabListContainer}>
          <div className={styles.tabToolbar}>
            <Tabs.List className={styles.tabList} aria-label={t('sidebar.contentAria')}>
              <SidebarViewTab
                id={SIDEBAR_TAB.SESSIONS}
                label={t('sidebar.sessions')}
                icon={MessageSquare}
                selected={selectedTab === SIDEBAR_TAB.SESSIONS}
              />
              <SidebarViewTab
                id={SIDEBAR_TAB.DRIVE}
                label={t('sidebar.drive')}
                icon={FolderOpen}
                selected={selectedTab === SIDEBAR_TAB.DRIVE}
              />
            </Tabs.List>
            <span className={styles.tabSearch}>
              <CommandPaletteTrigger />
            </span>
          </div>
        </Tabs.ListContainer>

        <div className={styles.panelViewport}>
          <div
            className={clsx(
              styles.panelTrack,
              selectedTab === SIDEBAR_TAB.DRIVE && styles.panelTrackDrive
            )}
          >
            <Tabs.Panel
              id={SIDEBAR_TAB.SESSIONS}
              className={clsx(styles.tabPanel, styles.sessionPanel)}
              shouldForceMount
            >
              <SessionListGroup selectedKeys={selectedKeys} refreshVersion={refreshVersion} />
            </Tabs.Panel>
            <Tabs.Panel
              id={SIDEBAR_TAB.DRIVE}
              className={clsx(styles.tabPanel, styles.drivePanel)}
              shouldForceMount
            >
              <SidebarDrive />
            </Tabs.Panel>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

AppSidebarTabs.displayName = 'AppSidebarTabs';

export default AppSidebarTabs;
