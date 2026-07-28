import { useChatSessionHistoryRefreshStore } from '@/components/ChatPanel/_store/useChatSessionHistoryRefreshStore';
import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import {
  APP_HEADER_NAV_KEY,
  resolveAppHeaderNavKey,
  type AppHeaderNavKey,
} from '@/layouts/_common/Sidebar/appSidebarNavigation';
import SidebarCourse from '@/layouts/_common/Sidebar/CourseSidebar';
import SidebarDrive from '@/layouts/_common/Sidebar/DriveSidebar/_components/SidebarDrive';
import CommandPaletteTrigger from '@/layouts/AppNavigation/CommandPaletteTrigger';
import { Tabs, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { BookOpen, FolderOpen, MessageSquare, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SessionListGroup from '../SessionListGroup';
import styles from './style.module.less';

const SIDEBAR_TAB = {
  SESSIONS: 'session-history',
  DRIVE: 'drive',
  COURSES: 'courses',
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

const resolveSidebarTab = (activeNavKey: AppHeaderNavKey | undefined): SidebarTabKey =>
  activeNavKey === APP_HEADER_NAV_KEY.CHAT
    ? SIDEBAR_TAB.SESSIONS
    : activeNavKey === APP_HEADER_NAV_KEY.COURSE
      ? SIDEBAR_TAB.COURSES
      : SIDEBAR_TAB.DRIVE;

function AppSidebarTabs() {
  const { t } = useTranslation('shell');
  const location = useLocation();
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const refreshVersion = useChatSessionHistoryRefreshStore((state) => state.refreshVersion);
  const activeNavKey = resolveAppHeaderNavKey(location.pathname);
  const [tabState, setTabState] = useState(() => ({
    observedNavKey: activeNavKey,
    selectedTab: resolveSidebarTab(activeNavKey),
  }));

  let selectedTab = tabState.selectedTab;
  if (tabState.observedNavKey !== activeNavKey) {
    selectedTab = resolveSidebarTab(activeNavKey);
    setTabState({ observedNavKey: activeNavKey, selectedTab });
  }

  const selectedKeys =
    activeNavKey === APP_HEADER_NAV_KEY.CHAT && currentSessionId
      ? [`session-${currentSessionId}`]
      : [];

  return (
    <div className={styles.menuContainer}>
      <Tabs
        className={styles.tabs}
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          const nextTab = String(key);
          if (
            nextTab === SIDEBAR_TAB.SESSIONS ||
            nextTab === SIDEBAR_TAB.DRIVE ||
            nextTab === SIDEBAR_TAB.COURSES
          ) {
            setTabState({ observedNavKey: activeNavKey, selectedTab: nextTab });
          }
        }}
      >
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
              <SidebarViewTab
                id={SIDEBAR_TAB.COURSES}
                label={t('sidebar.courses')}
                icon={BookOpen}
                selected={selectedTab === SIDEBAR_TAB.COURSES}
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
              selectedTab === SIDEBAR_TAB.DRIVE && styles.panelTrackDrive,
              selectedTab === SIDEBAR_TAB.COURSES && styles.panelTrackCourses
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
            <Tabs.Panel
              id={SIDEBAR_TAB.COURSES}
              className={clsx(styles.tabPanel, styles.coursePanel)}
              shouldForceMount
            >
              <SidebarCourse />
            </Tabs.Panel>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

AppSidebarTabs.displayName = 'AppSidebarTabs';

export default AppSidebarTabs;
