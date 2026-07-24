import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import { clearNewChatSessionStore } from '@/components/ChatPanel/_store/useNewChatSessionStore';
import {
  APP_HEADER_NAV_ITEMS,
  APP_HEADER_NAV_KEY,
  resolveAppHeaderNavKey,
  type AppHeaderNavKey,
} from '@/layouts/_common/Sidebar/appSidebarNavigation';
import { ListBox, ListBoxItem } from '@heroui/react';
import clsx from 'clsx';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppHeaderNavProps } from './index.type';
import styles from './style.module.less';

function AppHeaderNav({ collapsed }: AppHeaderNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const clearCurrentSession = useCurrentChatSessionStore((state) => state.clearCurrentSession);

  const activeNavKey = resolveAppHeaderNavKey(location.pathname);
  const selectedKeys =
    activeNavKey && !(activeNavKey === APP_HEADER_NAV_KEY.CHAT && currentSessionId)
      ? [activeNavKey]
      : [];

  const handleNavItemPress = (navKey: AppHeaderNavKey) => {
    if (navKey === APP_HEADER_NAV_KEY.CHAT) {
      clearCurrentSession();
      clearNewChatSessionStore();
    }
    navigate(navKey);
  };

  // Sliding indicator — direct DOM manipulation to avoid setState in effect
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setItemRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) {
        itemRefs.current.set(key, el);
      } else {
        itemRefs.current.delete(key);
      }
    },
    []
  );

  const syncIndicator = useCallback(() => {
    const indicatorEl = indicatorRef.current;
    const containerEl = containerRef.current;
    if (!indicatorEl || !containerEl) return;

    if (!activeNavKey) {
      indicatorEl.style.opacity = '0';
      return;
    }

    const activeEl = itemRefs.current.get(activeNavKey);
    if (!activeEl) {
      indicatorEl.style.opacity = '0';
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();
    indicatorEl.style.transform = `translateY(${elRect.top - containerRect.top}px)`;
    indicatorEl.style.opacity = '1';
  }, [activeNavKey]);

  useLayoutEffect(() => {
    syncIndicator();
  });

  useLayoutEffect(() => {
    const handleResize = () => syncIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncIndicator]);

  return (
    <div
      ref={containerRef}
      className={clsx(styles.navContainer, collapsed && styles.navContainerCollapsed)}
    >
      <div ref={indicatorRef} className={styles.indicator} />
      <ListBox
        aria-label="应用导航"
        selectionMode="single"
        selectedKeys={selectedKeys}
        className={clsx(styles.headerMenu, collapsed && styles.headerMenuCollapsed)}
      >
        {APP_HEADER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <ListBoxItem
              key={item.key}
              ref={setItemRef(item.key)}
              textValue={item.label}
              className={clsx(styles.menuItem, collapsed && styles.menuItemCollapsed)}
              onPress={() => handleNavItemPress(item.key)}
            >
              <span className={styles.menuIcon}>
                <Icon size={18} />
              </span>
              {!collapsed && <span className={styles.menuLabel}>{item.label}</span>}
            </ListBoxItem>
          );
        })}
      </ListBox>
    </div>
  );
}

export default AppHeaderNav;
