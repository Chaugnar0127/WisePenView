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
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import styles from './CourseResourceHost.module.less';

interface CourseResourceHostProps {
  courseId: string;
  courseGroupId: string;
  target: ResourceTarget;
  onTargetChange: (target: ResourceTarget) => void;
  onClose: () => void;
}

const ignoreChatContext = (_context?: ResourceChatContext): void => {};

function CourseResourceHost({
  courseId,
  courseGroupId,
  target,
  onTargetChange,
  onClose,
}: CourseResourceHostProps) {
  const [layoutConfig, setLayoutConfig] = useState<ResourceHostLayoutConfig>({});

  /** Viewer 的 layout effect 依赖稳定的 reset 引用，否则 Host 更新后会反复注销并重新注册布局。 */
  const resetLayoutConfig = useCallback(() => {
    setLayoutConfig({});
  }, []);

  const openResource: OpenResourceFn = (nextTarget) => {
    onTargetChange({
      resourceId: nextTarget.resourceId,
      resourceType: nextTarget.resourceType,
      resourceName: nextTarget.resourceName,
      viewer: nextTarget.viewer,
    });
  };

  const resourceHostContext: ResourceHostContextValue = {
    hostId: `course:${courseId}`,
    layoutConfig,
    routeContext: target,
    getNavigationScope: () => buildDriveNodeScope(courseGroupId),
    openResource,
    setLayoutConfig,
    resetLayoutConfig,
    setChatContext: ignoreChatContext,
    clearChatContext: ignoreChatContext,
  };

  return (
    <ResourceHostContext value={resourceHostContext}>
      <div className={clsx(styles.root, layoutConfig.className)}>
        <div className={clsx(styles.body, layoutConfig.bodyClassName)}>
          <ResourceRenderer target={target} onTargetChange={onTargetChange} onClose={onClose} />
        </div>
      </div>
    </ResourceHostContext>
  );
}

export default CourseResourceHost;
