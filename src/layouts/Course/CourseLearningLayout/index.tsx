import AppIconButton from '@/components/Button/AppIconButton';
import ChatPanel from '@/components/ChatPanel';
import {
  createResourceChatStateProvider,
  type ResourceChatContext,
} from '@/components/ChatPanel/ResourceChatProtocol';
import {
  SystemResizableHandle,
  SystemResizablePanel,
  SystemResizablePanelGroup,
} from '@/layouts/_common/SystemResizable';
import WorkspaceHeader from '@/layouts/Workspace/_common/WorkspaceHeader';
import type { ResourceHostLayoutConfig } from '@/views/workspace/ResourceHostContext';
import clsx from 'clsx';
import { ChevronRight, PanelRightClose, PanelRightOpen, Video } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCourseContext } from '../CourseContext';
import CourseResourceHost from '../CourseResourceHost';
import CourseOutlineSidebar from './_components/CourseOutlineSidebar';
import CourseResourceIcon from './_components/CourseResourceIcon';
import { useCourseChatDockController } from './controllers/useCourseChatDockController';
import { useCourseLearningNavigationController } from './controllers/useCourseLearningNavigationController';
import styles from './style.module.less';

const RESIZE_TARGET_MINIMUM_SIZE = { fine: 16, coarse: 32 };
const COURSE_LEARNING_MAIN_MIN_WIDTH = 700;

function CourseLearningLayout() {
  const { t } = useTranslation('course');
  const { course } = useCourseContext();
  const navigation = useCourseLearningNavigationController(course.courseId);
  const chatDock = useCourseChatDockController();
  const [resourceLayoutConfig, setResourceLayoutConfig] = useState<ResourceHostLayoutConfig>({});
  const [resourceChatContext, setResourceChatContext] = useState<ResourceChatContext>();
  const selectedNode = navigation.selectedNode;
  const registeredHeader =
    resourceLayoutConfig.header === false ? undefined : resourceLayoutConfig.header;
  const registeredResourceHeader =
    selectedNode?.nodeType === 'RESOURCE' &&
    registeredHeader?.resource?.resourceId === selectedNode.resourceId
      ? registeredHeader
      : undefined;
  const fallbackChatStateProvider =
    selectedNode?.nodeType === 'RESOURCE'
      ? createResourceChatStateProvider({
          resourceId: selectedNode.resourceId,
          resourceType: selectedNode.resourceType,
          viewer: selectedNode.viewer,
        })
      : undefined;
  const chatStateProvider =
    registeredResourceHeader?.resource && resourceLayoutConfig.chatStateProvider
      ? resourceLayoutConfig.chatStateProvider
      : fallbackChatStateProvider;

  const handleClearResourceChatContext = (context?: ResourceChatContext) => {
    setResourceChatContext((current) => (context && current !== context ? current : undefined));
  };

  const workspaceHeader = registeredResourceHeader?.resource ? (
    <WorkspaceHeader
      {...registeredResourceHeader}
      resource={{
        ...registeredResourceHeader.resource,
        resourceId: undefined,
        breadcrumbItems: [],
        onBreadcrumbNavigate: () => {},
        leadingActions: undefined,
        actions: undefined,
        moreMenu: undefined,
        chatPanelCollapsed: chatDock.collapsed,
        onToggleChatPanel: chatDock.toggle,
      }}
    />
  ) : (
    <WorkspaceHeader
      inlineTitle={
        <span className={styles.workspaceTitle}>
          {selectedNode ? <CourseResourceIcon node={selectedNode} size={18} /> : null}
          <span>{selectedNode?.title ?? course.name}</span>
        </span>
      }
      extra={
        <AppIconButton
          icon={
            chatDock.collapsed ? (
              <PanelRightOpen size={18} aria-hidden />
            ) : (
              <PanelRightClose size={18} aria-hidden />
            )
          }
          label={chatDock.collapsed ? t('learning.openChat') : t('learning.closeChat')}
          isActive={!chatDock.collapsed}
          onPress={chatDock.toggle}
        />
      }
    />
  );

  return (
    <SystemResizablePanelGroup
      orientation="horizontal"
      className={clsx(styles.root, chatDock.open && styles.rootChatOpen)}
      resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
      onLayoutChanged={chatDock.handleLayoutChanged}
    >
      <SystemResizablePanel
        id="course-learning-main"
        minSize={COURSE_LEARNING_MAIN_MIN_WIDTH}
        className={styles.learningPanel}
      >
        <section className={styles.studyShell}>
          <CourseOutlineSidebar
            courseName={course.name}
            nodes={navigation.visibleNodes}
            selectedNodeId={selectedNode?.nodeId}
            searchQuery={navigation.searchQuery}
            expandSearchResults={Boolean(navigation.normalizedQuery)}
            loading={navigation.loading}
            error={navigation.error}
            onSearchQueryChange={navigation.setSearchQuery}
            onSelectNode={navigation.openOutlineNode}
            onSelectCourseSection={navigation.openCourseSection}
            onOpenCourseHome={navigation.openCourseHome}
            onOpenCourseList={navigation.openCourseList}
            onRetry={navigation.refresh}
          />

          <div className={styles.studyWorkspace}>
            {workspaceHeader}
            <main className={styles.studyMain}>
              {selectedNode ? (
                selectedNode.nodeType === 'RESOURCE' ? (
                  selectedNode.viewer === 'video' ? (
                    <div className={styles.resourceViewer}>
                      <Video size={44} aria-hidden />
                      <h2>{selectedNode.title}</h2>
                      <p>{t('outline.videoUnsupported')}</p>
                    </div>
                  ) : (
                    <CourseResourceHost
                      key={selectedNode.nodeId}
                      courseId={course.courseId}
                      groupId={course.courseId}
                      target={{
                        resourceId: selectedNode.resourceId,
                        resourceType: selectedNode.resourceType,
                        resourceName: selectedNode.title,
                        viewer: selectedNode.viewer,
                      }}
                      layoutConfig={resourceLayoutConfig}
                      onTargetChange={(target) => {
                        if (target.resourceId) navigation.openResource(target.resourceId);
                      }}
                      onLayoutConfigChange={setResourceLayoutConfig}
                      onSetChatContext={setResourceChatContext}
                      onClearChatContext={handleClearResourceChatContext}
                      onClose={navigation.openCourseHome}
                    />
                  )
                ) : (
                  <div className={styles.sectionOverview}>
                    <p>
                      {t('outline.resourceCount', { count: navigation.selectedResources.length })}
                    </p>
                    <div className={styles.resourceList}>
                      {navigation.selectedResources.map((resource) => (
                        <button
                          key={resource.nodeId}
                          type="button"
                          onClick={() => navigation.openOutlineNode(resource.nodeId)}
                        >
                          <CourseResourceIcon node={resource} size={18} />
                          <span>
                            <strong>{resource.title}</strong>
                            <small>
                              {resource.read ? t('outline.read') : t('outline.unread')}
                              {resource.durationLabel ? ` · ${resource.durationLabel}` : ''}
                            </small>
                          </span>
                          <ChevronRight size={17} aria-hidden />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className={styles.emptyMain}>{t('outline.empty')}</div>
              )}
            </main>
          </div>
        </section>
      </SystemResizablePanel>

      <SystemResizableHandle
        className={clsx(styles.resizeHandle, !chatDock.open && styles.resizeHandleCollapsed)}
        disabled={!chatDock.open}
      />
      <SystemResizablePanel
        id="course-learning-chat"
        panelRef={chatDock.panelRef}
        defaultSize={chatDock.panelSize}
        minSize={chatDock.minSize}
        maxSize={chatDock.maxSize}
        groupResizeBehavior="preserve-pixel-size"
        className={styles.chatDock}
        aria-label={t('learning.chat')}
        aria-hidden={!chatDock.open ? true : undefined}
        onResize={chatDock.handleResize}
      >
        {chatDock.open ? (
          <ChatPanel
            showCollapseButton={false}
            resourceChat={{
              provider: chatStateProvider,
              context: resourceChatContext,
              clearContext: handleClearResourceChatContext,
            }}
          />
        ) : null}
      </SystemResizablePanel>
    </SystemResizablePanelGroup>
  );
}

export default CourseLearningLayout;
