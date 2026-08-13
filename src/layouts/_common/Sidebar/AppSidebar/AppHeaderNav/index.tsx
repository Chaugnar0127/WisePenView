import { APP_HEADER_NAV_KEY, type AppHeaderNavKey } from '@/bootstrap/routeMeta';
import { useCurrentChatSessionStore } from '@/components/ChatPanel/_store/useCurrentChatSessionStore';
import { clearNewChatSessionStore } from '@/components/ChatPanel/_store/useNewChatSessionStore';
import { useDriveService, useNoteService } from '@/domains';
import { useApi } from '@/hooks/useApi';
import { useAppRouteMeta } from '@/hooks/useAppRouteMeta';
import { useOpenResource } from '@/hooks/useOpenResource';
import { useAppAuth } from '@/layouts/App/AppAuthContext';
import { APP_HEADER_NAV_ITEMS } from '@/layouts/_common/Sidebar/appSidebarNavigation';
import { cn } from '@/utils/cn';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';
import { RESOURCE_KIND } from '@/utils/navigation/resourceTarget';
import { ListBox, ListBoxItem } from '@heroui/react';
import { NotebookPen } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSidebarViewTabStore } from '../_store/useSidebarViewTabStore';
import styles from './style.module.less';

function AppHeaderNav() {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const routeMeta = useAppRouteMeta();
  const appAuth = useAppAuth();
  const driveService = useDriveService();
  const noteService = useNoteService();
  const openResource = useOpenResource();
  const clearCurrentSession = useCurrentChatSessionStore((state) => state.clearCurrentSession);
  const storedHeaderNavKey = useSidebarViewTabStore((state) => state.headerNavKey);
  const setHeaderNavKey = useSidebarViewTabStore((state) => state.setHeaderNavKey);
  const selectedKey = routeMeta?.headerNav ?? storedHeaderNavKey;

  const { loading: creatingNote, run: createNote } = useApi(
    async () => {
      const root = await driveService.getRoot();
      if (!root.canMountResources || !root.tagId) {
        throw createClientError(FRONTEND_CLIENT_ERROR.INTERNAL_STATE, {
          reason: '个人云盘根目录不可挂载资源',
        });
      }
      const mountTagId = root.tagId;

      const title = t('navigation.defaultNoteTitle');
      const result = await noteService.createNote({ title, pathTagId: mountTagId });
      if (!result.resourceId) {
        throw createClientError(FRONTEND_CLIENT_ERROR.NOTE_CREATE_RESOURCE_ID_MISSING);
      }
      return { resourceId: result.resourceId, root, title, mountTagId };
    },
    {
      manual: true,
      onSuccess: ({ resourceId, root, title, mountTagId }) => {
        openResource({
          resourceId,
          resourceType: RESOURCE_KIND.NOTE,
          resourceName: title,
          driveLocation: { scope: root.scope, mountTagId },
        });
      },
    }
  );

  const handleNavItemPress = (navKey: AppHeaderNavKey) => {
    if (!appAuth.isAuthenticated) {
      appAuth.requireLogin();
      return;
    }
    const navItem = APP_HEADER_NAV_ITEMS.find((item) => item.key === navKey);
    if (!navItem) return;
    setHeaderNavKey(navKey);
    if (navKey === APP_HEADER_NAV_KEY.CHAT) {
      clearCurrentSession();
      clearNewChatSessionStore();
    }
    navigate(navItem.to);
  };

  const handleCreateNote = () => {
    if (!appAuth.isAuthenticated) {
      appAuth.requireLogin();
      return;
    }
    if (!creatingNote) createNote();
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
      {/* selectionMode=none + onAction：导航走 action；选中态由当前路由元信息计算，刷新后保持一致。 */}
      <ListBox
        aria-label={t('navigation.appAria')}
        selectionMode="none"
        className={styles.headerMenu}
        onAction={(key) => handleNavItemPress(String(key) as AppHeaderNavKey)}
      >
        {APP_HEADER_NAV_ITEMS.flatMap((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          const isActive = item.key === selectedKey;
          const navItem = (
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
          if (item.key !== APP_HEADER_NAV_KEY.CHAT) return [navItem];

          return [
            navItem,
            <ListBoxItem
              key="create-note"
              id="create-note"
              textValue={t('navigation.newNote')}
              isDisabled={creatingNote}
              onAction={handleCreateNote}
              className={styles.menuItem}
            >
              <span className={styles.menuIcon}>
                <NotebookPen size={18} />
              </span>
              <span className={styles.menuLabel}>{t('navigation.newNote')}</span>
            </ListBoxItem>,
          ];
        })}
      </ListBox>
    </div>
  );
}

export default AppHeaderNav;
