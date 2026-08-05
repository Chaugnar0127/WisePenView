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
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  APP_SIDEBAR_TAB,
  useAppSidebarSelectionStore,
  type AppSidebarTabKey,
} from '../_store/useAppSidebarSelectionStore';
import SessionListGroup from '../SessionListGroup';
import styles from './style.module.less';

interface SidebarViewTabProps {
  id: AppSidebarTabKey;
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

const resolveInitialSidebarTab = (
  activeNavKey: AppHeaderNavKey | undefined,
  pathname: string
): AppSidebarTabKey =>
  pathname === '/app/course' || pathname.startsWith('/app/course/')
    ? APP_SIDEBAR_TAB.COURSES
    : activeNavKey === APP_HEADER_NAV_KEY.CHAT
      ? APP_SIDEBAR_TAB.SESSIONS
      : APP_SIDEBAR_TAB.DRIVE;

function AppSidebarTabs() {
  const { t } = useTranslation('shell');
  const location = useLocation();
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const refreshVersion = useChatSessionHistoryRefreshStore((state) => state.refreshVersion);
  const tabInitialized = useAppSidebarSelectionStore((state) => state.tabInitialized);
  const storedSelectedTab = useAppSidebarSelectionStore((state) => state.selectedTab);
  const initializeSelectedTab = useAppSidebarSelectionStore((state) => state.initializeSelectedTab);
  const setSelectedTab = useAppSidebarSelectionStore((state) => state.setSelectedTab);
  const activeNavKey = resolveAppHeaderNavKey(location.pathname);
  const initialTab = resolveInitialSidebarTab(activeNavKey, location.pathname);
  const selectedTab = tabInitialized ? storedSelectedTab : initialTab;
  const selectedKeys = currentSessionId ? [`session-${currentSessionId}`] : [];

  useLayoutEffect(() => {
    if (!tabInitialized) {
      initializeSelectedTab(initialTab);
    }
  }, [initialTab, initializeSelectedTab, tabInitialized]);

  return (
    <div className={styles.menuContainer}>
      <Tabs
        className={styles.tabs}
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          const nextTab = String(key);
          if (
            nextTab === APP_SIDEBAR_TAB.SESSIONS ||
            nextTab === APP_SIDEBAR_TAB.DRIVE ||
            nextTab === APP_SIDEBAR_TAB.COURSES
          ) {
            setSelectedTab(nextTab);
          }
        }}
      >
        <Tabs.ListContainer className={styles.tabListContainer}>
          <div className={styles.tabToolbar}>
            <Tabs.List className={styles.tabList} aria-label={t('sidebar.contentAria')}>
              <SidebarViewTab
                id={APP_SIDEBAR_TAB.SESSIONS}
                label={t('sidebar.sessions')}
                icon={MessageSquare}
                selected={selectedTab === APP_SIDEBAR_TAB.SESSIONS}
              />
              <SidebarViewTab
                id={APP_SIDEBAR_TAB.DRIVE}
                label={t('sidebar.drive')}
                icon={FolderOpen}
                selected={selectedTab === APP_SIDEBAR_TAB.DRIVE}
              />
              <SidebarViewTab
                id={APP_SIDEBAR_TAB.COURSES}
                label={t('sidebar.courses')}
                icon={BookOpen}
                selected={selectedTab === APP_SIDEBAR_TAB.COURSES}
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
              selectedTab === APP_SIDEBAR_TAB.DRIVE && styles.panelTrackDrive,
              selectedTab === APP_SIDEBAR_TAB.COURSES && styles.panelTrackCourses
            )}
          >
            <Tabs.Panel
              id={APP_SIDEBAR_TAB.SESSIONS}
              className={clsx(styles.tabPanel, styles.sessionPanel)}
              shouldForceMount
            >
              <SessionListGroup selectedKeys={selectedKeys} refreshVersion={refreshVersion} />
            </Tabs.Panel>
            <Tabs.Panel
              id={APP_SIDEBAR_TAB.DRIVE}
              className={clsx(styles.tabPanel, styles.drivePanel)}
              shouldForceMount
            >
              <SidebarDrive />
            </Tabs.Panel>
            <Tabs.Panel
              id={APP_SIDEBAR_TAB.COURSES}
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
