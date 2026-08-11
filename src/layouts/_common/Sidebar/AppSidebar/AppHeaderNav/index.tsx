import { APP_HEADER_NAV_KEY, type AppHeaderNavKey } from '@/bootstrap/routeMeta';
import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import { clearNewChatSessionStore } from '@/components/ChatPanel/_store/useNewChatSessionStore';
import { useAppAuth } from '@/layouts/App/AppAuthContext';
import { APP_HEADER_NAV_ITEMS } from '@/layouts/_common/Sidebar/appSidebarNavigation';
import { cn } from '@/utils/cn';
import { ListBox, ListBoxItem } from '@heroui/react';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppHeaderNavStore } from '../_store/useAppHeaderNavStore';
import styles from './style.module.less';

function AppHeaderNav() {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const appAuth = useAppAuth();
  const clearCurrentSession = useCurrentChatSessionStore((state) => state.clearCurrentSession);
  const selectedKey = useAppHeaderNavStore((state) => state.selectedKey);
  const setSelectedKey = useAppHeaderNavStore((state) => state.setSelectedKey);

  const handleNavItemPress = (navKey: AppHeaderNavKey) => {
    if (!appAuth.isAuthenticated) {
      appAuth.requireLogin();
      return;
    }
    setSelectedKey(navKey);
    const navItem = APP_HEADER_NAV_ITEMS.find((item) => item.key === navKey);
    if (!navItem) return;
    if (navKey === APP_HEADER_NAV_KEY.CHAT) {
      clearCurrentSession();
      clearNewChatSessionStore();
    }
    navigate(navItem.to);
  };

  // 滑动指示器直接同步 DOM，避免在布局副作用中触发额外渲染。
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setItemRef = (key: string) => (el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(key, el);
    } else {
      itemRefs.current.delete(key);
    }
  };

  useLayoutEffect(() => {
    const indicatorEl = indicatorRef.current;
    const containerEl = containerRef.current;
    const syncIndicator = () => {
      if (!indicatorEl || !containerEl) return;

      if (!selectedKey) {
        indicatorEl.style.opacity = '0';
        return;
      }

      const activeEl = itemRefs.current.get(selectedKey);
      if (!activeEl) {
        indicatorEl.style.opacity = '0';
        return;
      }

      const containerRect = containerEl.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      if (elRect.width < 2 || elRect.height < 2 || containerRect.width < 2) {
        indicatorEl.style.opacity = '0';
        return;
      }

      indicatorEl.style.transform = `translateY(${elRect.top - containerRect.top}px)`;
      indicatorEl.style.opacity = '1';
    };

    syncIndicator();
    const observer = new ResizeObserver(syncIndicator);
    if (containerEl) observer.observe(containerEl);
    const selectedEl = selectedKey ? itemRefs.current.get(selectedKey) : undefined;
    if (selectedEl) observer.observe(selectedEl);
    return () => observer.disconnect();
  }, [selectedKey]);

  return (
    <div ref={containerRef} className={styles.navContainer}>
      <div ref={indicatorRef} className={styles.indicator} />
      {/* selectionMode=none + onAction：导航走 action；选中态由共享 store 保持，不再跟随路由切换 */}
      <ListBox
        aria-label={t('navigation.appAria')}
        selectionMode="none"
        className={styles.headerMenu}
        onAction={(key) => handleNavItemPress(String(key) as AppHeaderNavKey)}
      >
        {APP_HEADER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          const isActive = item.key === selectedKey;
          return (
            <ListBoxItem
              key={item.key}
              id={item.key}
              ref={setItemRef(item.key)}
              textValue={label}
              aria-current={isActive ? 'page' : undefined}
              data-nav-active={isActive ? 'true' : undefined}
              className={cn(styles.menuItem, isActive && styles.menuItemActive)}
            >
              <span className={styles.menuIcon}>
                <Icon size={18} />
              </span>
              <span className={styles.menuLabel}>{label}</span>
            </ListBoxItem>
          );
        })}
      </ListBox>
    </div>
  );
}

export default AppHeaderNav;
