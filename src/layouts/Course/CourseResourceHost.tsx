import type { ResourceChatContext } from '@/components/ChatPanel/ResourceChatProtocol';
import { buildDriveNodeScope } from '@/domains/Drive';
import type { ResourceTarget } from '@/utils/navigation/resourceTarget';
import {
  ResourceHostContext,
  type OpenResourceFn,
  type ResourceHostContextValue,
  type ResourceHostLayoutConfig,
} from '@/views/workspace/ResourceHostContext';
import ResourceRenderer from '@/views/workspace/ResourceRenderer';
import WorkspaceResourceSidePanel from '@/views/workspace/_components/WorkspaceResourceSidePanel';
import clsx from 'clsx';
import styles from './CourseResourceHost.module.less';

interface CourseResourceHostProps {
  courseId: string;
  groupId: string;
  target: ResourceTarget;
  layoutConfig: ResourceHostLayoutConfig;
  onTargetChange: (target: ResourceTarget) => void;
  onLayoutConfigChange: (config: ResourceHostLayoutConfig) => void;
  onSetChatContext: (context: ResourceChatContext) => void;
  onClearChatContext: (context?: ResourceChatContext) => void;
  onClose: () => void;
}

function CourseResourceHost({
  courseId,
  groupId,
  target,
  layoutConfig,
  onTargetChange,
  onLayoutConfigChange,
  onSetChatContext,
  onClearChatContext,
  onClose,
}: CourseResourceHostProps) {
  const resetLayoutConfig = () => {
    onLayoutConfigChange({});
  };

  const openResource: OpenResourceFn = (nextTarget) => {
    onTargetChange({
      resourceId: nextTarget.resourceId,
      resourceType: nextTarget.resourceType,
      resourceName: nextTarget.resourceName,
      viewer: nextTarget.viewer,
    });
  };

  const resourceHostContext: ResourceHostContextValue = {
    hostId: `course:${courseId}:${target.resourceId ?? 'empty'}`,
    layoutConfig,
    routeContext: target,
    getNavigationScope: () => buildDriveNodeScope(groupId),
    openResource,
    setLayoutConfig: onLayoutConfigChange,
    resetLayoutConfig,
    setChatContext: onSetChatContext,
    clearChatContext: onClearChatContext,
  };
  const sidePanelConfig =
    layoutConfig.sidePanel?.resource.resourceId === target.resourceId
      ? layoutConfig.sidePanel
      : undefined;

  return (
    <ResourceHostContext value={resourceHostContext}>
      <WorkspaceResourceSidePanel resourceId={target.resourceId ?? ''} config={sidePanelConfig}>
        <div className={clsx(styles.root, layoutConfig.className)}>
          <div className={clsx(styles.body, layoutConfig.bodyClassName)}>
            <ResourceRenderer target={target} onTargetChange={onTargetChange} onClose={onClose} />
          </div>
        </div>
      </WorkspaceResourceSidePanel>
    </ResourceHostContext>
  );
}

export default CourseResourceHost;
