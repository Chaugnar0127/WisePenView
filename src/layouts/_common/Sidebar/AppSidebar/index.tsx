import { memo } from 'react';
import SidebarHeader from '../_common/SidebarHeader';
import UserProfile from '../_common/UserProfile';
import styles from '../_common/sidebarShell.module.less';
import AppHeaderNav from './AppHeaderNav';
import AppSidebarTabs from './AppSidebarTabs';
import type { AppSidebarProps } from './index.type';

function AppSidebar({ canGoBack, canGoForward, onGoBack, onGoForward, onToggle }: AppSidebarProps) {
  return (
    <div className={styles.sider}>
      <SidebarHeader
        collapsed={false}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        nav={<AppHeaderNav />}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onToggle={onToggle}
      />
      <AppSidebarTabs />
      <UserProfile collapsed={false} />
    </div>
  );
}

export default memo(AppSidebar);
