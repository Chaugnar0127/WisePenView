import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import UserProfile from '../_common/footer/UserProfile';
import HeaderNav from '../_common/header/HeaderNav';
import SidebarHeader from '../_common/header/SidebarHeader';
import styles from '../_common/sidebarShell.module.less';
import AppSidebarTabs from '../_common/tab';
import type { AppSidebarProps } from './index.type';
import { useAppSidebarHeaderNav } from './useAppSidebarHeaderNav';

function AppSidebar({
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onToggle,
  onNavigate,
}: AppSidebarProps) {
  const { t } = useTranslation('shell');
  const { items: headerNavItems, selectedKey } = useAppSidebarHeaderNav({ onNavigate });

  return (
    <div className={styles.sider}>
      <SidebarHeader
        collapsed={false}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        nav={
          <HeaderNav
            ariaLabel={t('navigation.appAria')}
            activeKey={selectedKey}
            items={headerNavItems}
            showIndicator
          />
        }
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
