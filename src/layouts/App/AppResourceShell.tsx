import { useOpenResource } from '@/hooks/useOpenResource';
import { useResourceChatProtocolStore } from '@/layouts/Resource/_store/useResourceChatProtocolStore';
import { useResourceNavigationStore } from '@/layouts/Resource/_store/useResourceNavigationStore';
import ResourceFrame from '@/layouts/Resource/ResourceFrame';
import ResourceShellHeader from '@/layouts/Resource/ResourceShellHeader';
import { useResourceBreadcrumb } from '@/layouts/Resource/useResourceBreadcrumb';
import { useResourceHeaderEndReserve } from '@/layouts/Resource/useResourceHeaderEndReserve';
import { normalizeResourceKind, resolveResourceViewer } from '@/utils/navigation/resourceTarget';
import ResourceSidePanelActions from '@/views/resource/_components/ResourceSidePanel/Actions';
import {
  DEFAULT_RESOURCE_HOST_ID,
  ResourceHostContext,
  type ResourceHostContextValue,
  type ResourceHostLayoutConfig,
} from '@/views/resource/ResourceHostContext';
import { useState, type ReactNode } from 'react';
import { useLocation, useParams } from 'react-router-dom';

interface AppResourceShellProps {
  children: ReactNode;
}

function AppResourceShell({ children }: AppResourceShellProps) {
  const [layoutConfig, setLayoutConfigState] = useState<ResourceHostLayoutConfig>({});
  const openResource = useOpenResource();
  const location = useLocation();
  const resourceRouteParams = useParams<{ resourceType?: string; resourceId?: string }>();
  const { headerRef } = useResourceHeaderEndReserve({
    idleDockWidthPx: 0,
    isAnimating: false,
  });
  const routeContext = (() => {
    const rawResourceType = resourceRouteParams.resourceType;
    const resourceId = resourceRouteParams.resourceId;
    const resourceType = normalizeResourceKind(rawResourceType);
    const viewer = resolveResourceViewer({
      resourceType: rawResourceType,
      viewer: new URLSearchParams(location.search).get('viewer') ?? undefined,
    });

    return {
      resourceId,
      resourceType,
      viewer,
    };
  })();
  const resourceBreadcrumbItems = useResourceBreadcrumb(routeContext.resourceId);

  const resetLayoutConfig = () => {
    setLayoutConfigState({});
  };

  const resourceHostContext = {
    hostId: DEFAULT_RESOURCE_HOST_ID,
    layoutConfig,
    routeContext,
    getNavigationScope: () => useResourceNavigationStore.getState().location.scope,
    openResource,
    setLayoutConfig: setLayoutConfigState,
    resetLayoutConfig,
    setChatContext: useResourceChatProtocolStore.getState().setContext,
    clearChatContext: useResourceChatProtocolStore.getState().clearContext,
  } satisfies ResourceHostContextValue;

  const renderHeader = () => {
    if (layoutConfig.header === false) return null;

    const headerConfig = layoutConfig.header ?? {};
    const sidePanelConfig =
      layoutConfig.sidePanel?.resource.resourceId === routeContext.resourceId
        ? layoutConfig.sidePanel
        : undefined;
    const resource = headerConfig.resource
      ? {
          ...headerConfig.resource,
          breadcrumbItems: resourceBreadcrumbItems,
        }
      : undefined;

    return (
      <ResourceShellHeader
        {...headerConfig}
        resource={resource}
        resourceSidePanelActions={
          sidePanelConfig ? (
            <ResourceSidePanelActions
              resourceId={sidePanelConfig.resource.resourceId}
              inlineCommentAvailable={Boolean(sidePanelConfig.inlineComment)}
              disabled={headerConfig.resource?.isDisabled}
            />
          ) : undefined
        }
        headerRef={headerRef}
      />
    );
  };

  return (
    <ResourceHostContext value={resourceHostContext}>
      <ResourceFrame
        className={layoutConfig.className}
        bodyClassName={layoutConfig.bodyClassName}
        header={renderHeader()}
      >
        {children}
      </ResourceFrame>
    </ResourceHostContext>
  );
}

export default AppResourceShell;
