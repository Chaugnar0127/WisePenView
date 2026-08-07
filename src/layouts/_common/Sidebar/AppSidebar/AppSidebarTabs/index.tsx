import { useChatSessionHistoryRefreshStore } from '@/components/ChatPanel/_store/useChatSessionHistoryRefreshStore';
import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import { TOOLTIP_FOCUS_PASSTHROUGH_PROPS } from '@/layouts/_common/a11y/tooltipFocusPassthrough';
import SidebarCourse from '@/layouts/_common/Sidebar/CourseSidebar';
import SidebarDrive from '@/layouts/_common/Sidebar/DriveSidebar/_components/SidebarDrive';
import { useAppAuth } from '@/layouts/App/AppAuthContext';
import CommandPaletteTrigger from '@/layouts/AppNavigation/CommandPaletteTrigger';
import { Tabs, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { BookOpen, FolderOpen, MessageSquare, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SessionListGroup from '../SessionListGroup';
import styles from './style.module.less';

const SIDEBAR_VIEW_TAB = {
  SESSIONS: 'session-history',
  DRIVE: 'drive',
  COURSES: 'courses',
} as const;

type SidebarViewTabKey = (typeof SIDEBAR_VIEW_TAB)[keyof typeof SIDEBAR_VIEW_TAB];

interface SidebarViewTabProps {
  id: SidebarViewTabKey;
  label: string;
  icon: LucideIcon;
  selected: boolean;
}

function SidebarViewTab({ id, label, icon: Icon, selected }: SidebarViewTabProps) {
  return (
    <Tabs.Tab id={id} className={styles.tab} aria-label={label}>
      <Tooltip isDisabled={selected}>
        <Tooltip.Trigger className={styles.tabTooltipTrigger} {...TOOLTIP_FOCUS_PASSTHROUGH_PROPS}>
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
  const appAuth = useAppAuth();
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const refreshVersion = useChatSessionHistoryRefreshStore((state) => state.refreshVersion);
  const [selectedTab, setSelectedTab] = useState<SidebarViewTabKey>(SIDEBAR_VIEW_TAB.DRIVE);
  const selectedKeys = currentSessionId ? [`session-${currentSessionId}`] : [];

  if (!appAuth.isAuthenticated) {
    return (
      <div className={styles.menuContainer}>
        <Tabs
          className={styles.tabs}
          selectedKey={SIDEBAR_VIEW_TAB.SESSIONS}
          onSelectionChange={() => appAuth.requireLogin()}
        >
          <Tabs.ListContainer className={styles.tabListContainer}>
            <div className={styles.tabToolbar}>
              <Tabs.List className={styles.tabList} aria-label={t('sidebar.contentAria')}>
                <SidebarViewTab
                  id={SIDEBAR_VIEW_TAB.SESSIONS}
                  label={t('sidebar.sessions')}
                  icon={MessageSquare}
                  selected
                />
                <SidebarViewTab
                  id={SIDEBAR_VIEW_TAB.DRIVE}
                  label={t('sidebar.drive')}
                  icon={FolderOpen}
                  selected={false}
                />
                <SidebarViewTab
                  id={SIDEBAR_VIEW_TAB.COURSES}
                  label={t('sidebar.courses')}
                  icon={BookOpen}
                  selected={false}
                />
              </Tabs.List>
              <span className={styles.tabSearch}>
                <CommandPaletteTrigger />
              </span>
            </div>
          </Tabs.ListContainer>

          <button type="button" className={styles.anonymousPanel} onClick={appAuth.requireLogin}>
            <div className={styles.anonymousTitle}>{t('anonymous.sidebarTitle')}</div>
            <div className={styles.anonymousHint}>{t('anonymous.sidebarHint')}</div>
          </button>
        </Tabs>
      </div>
    );
  }

  return (
    <div className={styles.menuContainer}>
      <Tabs
        className={styles.tabs}
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          setSelectedTab(key as SidebarViewTabKey);
        }}
      >
        <Tabs.ListContainer className={styles.tabListContainer}>
          <div className={styles.tabToolbar}>
            <Tabs.List className={styles.tabList} aria-label={t('sidebar.contentAria')}>
              <SidebarViewTab
                id={SIDEBAR_VIEW_TAB.SESSIONS}
                label={t('sidebar.sessions')}
                icon={MessageSquare}
                selected={selectedTab === SIDEBAR_VIEW_TAB.SESSIONS}
              />
              <SidebarViewTab
                id={SIDEBAR_VIEW_TAB.DRIVE}
                label={t('sidebar.drive')}
                icon={FolderOpen}
                selected={selectedTab === SIDEBAR_VIEW_TAB.DRIVE}
              />
              <SidebarViewTab
                id={SIDEBAR_VIEW_TAB.COURSES}
                label={t('sidebar.courses')}
                icon={BookOpen}
                selected={selectedTab === SIDEBAR_VIEW_TAB.COURSES}
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
              selectedTab === SIDEBAR_VIEW_TAB.DRIVE && styles.panelTrackDrive,
              selectedTab === SIDEBAR_VIEW_TAB.COURSES && styles.panelTrackCourses
            )}
          >
            <Tabs.Panel
              id={SIDEBAR_VIEW_TAB.SESSIONS}
              className={clsx(styles.tabPanel, styles.sessionPanel)}
              shouldForceMount
            >
              <SessionListGroup selectedKeys={selectedKeys} refreshVersion={refreshVersion} />
            </Tabs.Panel>
            <Tabs.Panel
              id={SIDEBAR_VIEW_TAB.DRIVE}
              className={clsx(styles.tabPanel, styles.drivePanel)}
              shouldForceMount
            >
              <SidebarDrive />
            </Tabs.Panel>
            <Tabs.Panel
              id={SIDEBAR_VIEW_TAB.COURSES}
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
