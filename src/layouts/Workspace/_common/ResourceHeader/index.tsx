import AppIconButton from '@/components/Button/AppIconButton';
import EntryIcon from '@/components/Icons/EntryIcon';
import type { AppBreadcrumbItem } from '@/components/Navigation/AppBreadcrumb';
import { AppPopover } from '@/components/Overlay';
import ResourcePermissionModal from '@/components/Resource/ResourcePermissionModal';
import { useUserService } from '@/domains';
import { normalizeId } from '@/utils/normalize/normalizeId';
import { Dropdown } from '@heroui/react';
import { useRequest } from 'ahooks';
import {
  ChevronRight,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  FolderInput,
  HardDrive,
  Link2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Printer,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ResourceHeaderOperations, {
  type ResourceHeaderOperationHandlers,
} from './ResourceHeaderOperations';
import type { ResourceHeaderMoreMenu, ResourceHeaderProps } from './index.type';
import styles from './style.module.less';

interface ResourceHeaderMenuItemContentProps {
  icon: LucideIcon;
  label: string;
  trailing?: ReactNode;
}

function ResourceHeaderMenuItemContent({
  icon: Icon,
  label,
  trailing,
}: ResourceHeaderMenuItemContentProps) {
  return (
    <span className={styles.menuItemContent}>
      <Icon className={styles.menuItemIcon} size={16} aria-hidden="true" />
      <span className={styles.menuItemLabel} data-slot="label">
        {label}
      </span>
      {trailing ? <span className={styles.menuItemTrailing}>{trailing}</span> : null}
    </span>
  );
}

function ResourceHeaderMore({
  menu,
  operations,
  canManagePermission,
  isDisabled,
  onOpenPermission,
}: {
  menu?: ResourceHeaderMoreMenu;
  operations: ResourceHeaderOperationHandlers;
  canManagePermission: boolean;
  isDisabled?: boolean;
  onOpenPermission: () => void;
}) {
  const { t } = useTranslation('resource');
  const isMenuPending = Boolean(menu?.isPending);
  const isPending = isMenuPending || operations.isLocating;
  const handleAction = (key: React.Key) => {
    if (key === 'permission') {
      onOpenPermission();
      return;
    }
    if (key === 'create-copy') {
      operations.onCopy?.();
      return;
    }
    if (key === 'add-link') {
      operations.onCreateLink?.();
      return;
    }
    if (key === 'move-to') {
      operations.onMove?.();
      return;
    }
    if (key === 'share-to') {
      operations.onShare?.();
      return;
    }
    if (key === 'open-original') {
      operations.onOpenOriginal?.();
      return;
    }
    if (key === 'delete') {
      operations.onDelete?.();
      return;
    }
    if (key === 'comment-history') {
      menu?.onInlineCommentHistory?.();
      return;
    }
    if (key === 'print') {
      menu?.onPrint?.();
      return;
    }
    if (key === 'download') {
      menu?.download?.onAction();
      return;
    }
    if (key === 'search') {
      menu?.onSearch?.();
      return;
    }

    menu?.actions?.find((action) => action.id === key)?.onAction();
  };

  return (
    <Dropdown>
      <AppIconButton
        icon={<Ellipsis className={styles.moreIcon} size={22} aria-hidden="true" />}
        label={t('header.more')}
        size="sm"
        isDisabled={isDisabled || isMenuPending}
        aria-busy={isPending || undefined}
        overlayTrigger={<Dropdown.Trigger />}
      />
      <Dropdown.Popover placement="bottom end" className={styles.popover}>
        <AppPopover.Header>{t('header.moreActions')}</AppPopover.Header>
        <Dropdown.Menu aria-label={t('header.menuAria')} onAction={handleAction}>
          {operations.onOpenOriginal ? (
            <Dropdown.Section>
              <Dropdown.Item id="open-original" textValue={t('header.openOriginal')}>
                <ResourceHeaderMenuItemContent
                  icon={ExternalLink}
                  label={t('header.openOriginal')}
                />
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
          {operations.onCopy ? (
            <Dropdown.Section>
              <Dropdown.Item id="create-copy" textValue={t('header.createCopy')}>
                <ResourceHeaderMenuItemContent icon={Copy} label={t('header.createCopy')} />
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
          {operations.onCreateLink || operations.onMove || operations.onShare ? (
            <Dropdown.Section>
              {operations.onCreateLink ? (
                <Dropdown.Item id="add-link" textValue={t('header.addLink')}>
                  <ResourceHeaderMenuItemContent icon={Link2} label={t('header.addLink')} />
                </Dropdown.Item>
              ) : null}
              {operations.onMove ? (
                <Dropdown.Item id="move-to" textValue={t('header.moveTo')}>
                  <ResourceHeaderMenuItemContent icon={FolderInput} label={t('header.moveTo')} />
                </Dropdown.Item>
              ) : null}
              {operations.onShare ? (
                <Dropdown.Item id="share-to" textValue={t('header.shareToGroup')}>
                  <ResourceHeaderMenuItemContent icon={Share2} label={t('header.shareToGroup')} />
                </Dropdown.Item>
              ) : null}
            </Dropdown.Section>
          ) : null}
          {canManagePermission ? (
            <Dropdown.Section>
              <Dropdown.Item id="permission" textValue={t('header.permission')}>
                <ResourceHeaderMenuItemContent icon={ShieldCheck} label={t('header.permission')} />
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
          {menu?.showInlineCommentHistory ? (
            <Dropdown.Section>
              <Dropdown.Item
                id="comment-history"
                textValue={t('header.inlineCommentHistory')}
                isDisabled={!menu.onInlineCommentHistory}
              >
                <ResourceHeaderMenuItemContent
                  icon={MessageSquare}
                  label={t('header.inlineCommentHistory')}
                />
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
          {menu?.onSearch ? (
            <Dropdown.Section>
              <Dropdown.Item id="search" textValue={t('header.fullTextSearch')}>
                <ResourceHeaderMenuItemContent icon={Search} label={t('header.fullTextSearch')} />
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
          {menu?.actions?.length ? (
            <Dropdown.Section>
              {menu.actions.map((action) => (
                <Dropdown.Item key={action.id} id={action.id} textValue={action.label}>
                  <ResourceHeaderMenuItemContent icon={action.icon} label={action.label} />
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ) : null}
          {menu?.onPrint || menu?.download ? (
            <Dropdown.Section>
              {menu.onPrint ? (
                <Dropdown.Item id="print" textValue={menu.printLabel ?? t('header.print')}>
                  <ResourceHeaderMenuItemContent
                    icon={menu.printIcon ?? Printer}
                    label={menu.printLabel ?? t('header.print')}
                  />
                </Dropdown.Item>
              ) : null}
              {menu.download ? (
                <Dropdown.Item id="download" textValue={menu.download.label}>
                  <ResourceHeaderMenuItemContent icon={Download} label={menu.download.label} />
                </Dropdown.Item>
              ) : null}
            </Dropdown.Section>
          ) : null}
          {menu?.advanced ? (
            <Dropdown.Section>
              <Dropdown.SubmenuTrigger>
                <Dropdown.Item id="advanced" textValue={t('header.advanced')}>
                  <ResourceHeaderMenuItemContent
                    icon={Settings2}
                    label={t('header.advanced')}
                    trailing={<Dropdown.SubmenuIndicator />}
                  />
                </Dropdown.Item>
                <Dropdown.Popover
                  placement="right top"
                  className={`${styles.popover} ${styles.advancedPopover}`}
                >
                  <div className={styles.advancedPanel}>
                    <AppPopover.Header>{t('header.advancedSettings')}</AppPopover.Header>
                    {menu.advanced}
                  </div>
                </Dropdown.Popover>
              </Dropdown.SubmenuTrigger>
            </Dropdown.Section>
          ) : null}
          {operations.onDelete ? (
            <Dropdown.Section>
              <Dropdown.Item
                id="delete"
                textValue={operations.deleteLabel ?? t('header.deleteFile')}
                variant="danger"
              >
                <ResourceHeaderMenuItemContent
                  icon={Trash2}
                  label={operations.deleteLabel ?? t('header.deleteFile')}
                />
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function ResourceHeader({
  resourceId,
  resourceName,
  resourceType,
  resourceIconType,
  currentActions,
  copyVersion,
  permissionResourceType,
  ownerId,
  onPermissionSuccess,
  isDisabled,
  titleMeta,
  breadcrumbItems,
  leadingActions,
  actions,
  moreMenu,
  hideBreadcrumb,
  trailingActions,
  chatPanelCollapsed,
  onToggleChatPanel,
}: ResourceHeaderProps) {
  const { t } = useTranslation(['resource', 'chat']);
  const userService = useUserService();
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const normalizedOwnerId = normalizeId(ownerId);
  const { data: currentUser } = useRequest(() => userService.getUserInfo(), {
    ready: Boolean(resourceId && normalizedOwnerId),
    refreshDeps: [resourceId, normalizedOwnerId],
  });
  const canManagePermission = Boolean(
    resourceId && normalizedOwnerId && currentUser?.id === normalizedOwnerId
  );
  const currentBreadcrumbItem: AppBreadcrumbItem = {
    key: `resource:${resourceId ?? resourceName}`,
    current: true,
    label: (
      <>
        <span className={styles.titleIcon} aria-hidden="true">
          <EntryIcon
            entryType="resource"
            resourceType={resourceType}
            resourceIconType={resourceIconType}
          />
        </span>
        <span className={styles.titleText}>{resourceName}</span>
      </>
    ),
  };
  return (
    <>
      <div className={styles.root}>
        <div className={styles.title}>
          {!hideBreadcrumb ? (
            <nav className={styles.breadcrumb} aria-label={t('header.breadcrumbAria')}>
              {breadcrumbItems.map((item, index) => (
                <span key={item.key} className={styles.breadcrumbSegment}>
                  {item.to ? (
                    <RouterLink className={styles.breadcrumbButton} to={item.to}>
                      {index === 0 ? (
                        <HardDrive
                          className={styles.breadcrumbIcon}
                          size={14}
                          aria-hidden
                          color="var(--accent)"
                        />
                      ) : null}
                      {item.label}
                    </RouterLink>
                  ) : (
                    <span className={styles.breadcrumbButton}>{item.label}</span>
                  )}
                  <ChevronRight className={styles.breadcrumbSeparator} size={14} aria-hidden />
                </span>
              ))}
              <span className={styles.breadcrumbCurrent} aria-current="page">
                {currentBreadcrumbItem.label}
              </span>
            </nav>
          ) : (
            <span className={styles.breadcrumbCurrent} aria-current="page">
              {currentBreadcrumbItem.label}
            </span>
          )}
          {titleMeta ? <span className={styles.titleMeta}>{titleMeta}</span> : null}
        </div>
        <div className={styles.actions}>
          {leadingActions}
          {actions}
          {resourceId ? (
            <ResourceHeaderOperations
              resourceId={resourceId}
              resourceName={resourceName}
              resourceType={resourceType ?? permissionResourceType}
              currentActions={currentActions}
              copyVersion={copyVersion}
              onResolve={(operations) => (
                <ResourceHeaderMore
                  menu={moreMenu}
                  operations={operations}
                  canManagePermission={canManagePermission}
                  isDisabled={isDisabled}
                  onOpenPermission={() => setIsPermissionModalOpen(true)}
                />
              )}
            />
          ) : null}
          {trailingActions}
          {onToggleChatPanel ? (
            <AppIconButton
              icon={
                chatPanelCollapsed ? (
                  <PanelRightOpen size={18} aria-hidden="true" />
                ) : (
                  <PanelRightClose size={18} aria-hidden="true" />
                )
              }
              label={
                chatPanelCollapsed
                  ? t('panel.expand', { ns: 'chat' })
                  : t('panel.collapse', { ns: 'chat' })
              }
              size="sm"
              onPress={onToggleChatPanel}
            />
          ) : null}
        </div>
      </div>
      {resourceId && canManagePermission ? (
        <ResourcePermissionModal
          isOpen={isPermissionModalOpen}
          onOpenChange={setIsPermissionModalOpen}
          resourceId={resourceId}
          resourceType={permissionResourceType}
          onSuccess={onPermissionSuccess}
        />
      ) : null}
    </>
  );
}

export default ResourceHeader;
