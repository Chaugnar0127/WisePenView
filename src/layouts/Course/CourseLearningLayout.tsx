import AppIconButton from '@/components/Button/AppIconButton';
import ChatPanel from '@/components/ChatPanel';
import { useChatPanelStore } from '@/components/ChatPanel/_store/useChatPanelStore';
import { Spin } from '@/components/Feedback';
import { Input } from '@/components/Input';
import SegmentedTabs from '@/components/SegmentedTabs';
import Tree, { type DataNode } from '@/components/Tree';
import { useCourseService } from '@/domains';
import type { CourseOutlineNode, CourseOutlineResourceNode } from '@/domains/Course';
import WorkspaceHeader from '@/layouts/Workspace/_common/WorkspaceHeader';
import { parseErrorMessage } from '@/utils/error';
import { useCourseRouteContext } from '@/views/app/course/context';
import { Button, ProgressBar, toast } from '@heroui/react';
import { useMount, useRequest } from 'ahooks';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  Folder,
  LayoutGrid,
  NotebookPen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './CourseLearningLayout.module.less';
import CourseResourceHost from './CourseResourceHost';

function findOutlineNode(
  nodes: CourseOutlineNode[],
  nodeId: string
): CourseOutlineNode | undefined {
  for (const node of nodes) {
    if (node.nodeId === nodeId) return node;
    if (node.nodeType !== 'RESOURCE') {
      const child = findOutlineNode(node.children, nodeId);
      if (child) return child;
    }
  }
  return undefined;
}

function collectResources(nodes: CourseOutlineNode[]): CourseOutlineResourceNode[] {
  const resources: CourseOutlineResourceNode[] = [];
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') resources.push(node);
    else resources.push(...collectResources(node.children));
  }
  return resources;
}

function findResourceNodeByResourceId(
  nodes: CourseOutlineNode[],
  resourceId: string
): CourseOutlineResourceNode | undefined {
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') {
      if (node.resourceId === resourceId) return node;
      continue;
    }
    const child = findResourceNodeByResourceId(node.children, resourceId);
    if (child) return child;
  }
  return undefined;
}

function filterOutline(nodes: CourseOutlineNode[], query: string): CourseOutlineNode[] {
  if (!query) return nodes;
  const filtered: CourseOutlineNode[] = [];
  for (const node of nodes) {
    if (node.nodeType === 'RESOURCE') {
      if (node.title.toLocaleLowerCase().includes(query)) filtered.push(node);
      continue;
    }
    const children = filterOutline(node.children, query);
    if (node.title.toLocaleLowerCase().includes(query) || children.length > 0) {
      filtered.push({ ...node, children });
    }
  }
  return filtered;
}

function toTreeData(nodes: CourseOutlineNode[]): DataNode[] {
  return nodes.map((node) => {
    if (node.nodeType === 'RESOURCE') {
      return {
        key: node.nodeId,
        isLeaf: true,
        title: (
          <span className={styles.treeTitle}>
            {node.viewer === 'video' ? (
              <Video size={15} aria-hidden />
            ) : node.resourceType === 'note' ? (
              <NotebookPen size={15} aria-hidden />
            ) : (
              <FileText size={15} aria-hidden />
            )}
            <span>{node.title}</span>
            {node.read ? (
              <CheckCircle2 size={14} className={styles.readIcon} aria-label="read" />
            ) : (
              <Circle size={13} className={styles.unreadIcon} aria-label="unread" />
            )}
          </span>
        ),
      };
    }
    return {
      key: node.nodeId,
      title: (
        <span className={styles.treeTitle}>
          <Folder size={15} aria-hidden />
          <span>{node.title}</span>
        </span>
      ),
      children: toTreeData(node.children),
    };
  });
}

function CourseLearningLayout() {
  const { t } = useTranslation('course');
  const { course, refreshCourse } = useCourseRouteContext();
  const courseService = useCourseService();
  const navigate = useNavigate();
  const { outlineNodeId = '' } = useParams<{ outlineNodeId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const chatPanelCollapsed = useChatPanelStore((state) => state.chatPanelCollapsed);
  const setChatPanelCollapsed = useChatPanelStore((state) => state.setChatPanelCollapsed);
  const basePath = `/app/course/${course.courseId}`;
  const { data, loading, error, refresh } = useRequest(() =>
    courseService.getCourseOutline(course.courseId)
  );
  const { loading: updatingRead, run: updateRead } = useRequest(
    (nodeId: string, read: boolean) =>
      courseService.setResourceRead({
        courseId: course.courseId,
        outlineNodeId: nodeId,
        read,
      }),
    {
      manual: true,
      onSuccess: () => {
        refresh();
        refreshCourse();
      },
      onError: (requestError: unknown) => toast.danger(parseErrorMessage(requestError)),
    }
  );

  const outlineNodes = data?.nodes ?? [];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleNodes = filterOutline(outlineNodes, normalizedQuery);
  const selectedNode = findOutlineNode(outlineNodes, outlineNodeId) ?? outlineNodes[0];
  const selectedResources = selectedNode
    ? selectedNode.nodeType === 'RESOURCE'
      ? [selectedNode]
      : collectResources(selectedNode.children)
    : [];
  const chatOpen = !chatPanelCollapsed;
  const courseProgress = course.totalResourceCount
    ? Math.round((course.readResourceCount / course.totalResourceCount) * 100)
    : 0;

  useMount(() => {
    setChatPanelCollapsed(true);
  });

  const handleTreeSelect = (_keys: React.Key[], info: { node: DataNode }) => {
    navigate(`${basePath}/learning/${String(info.node.key)}`);
  };

  const handleCourseSectionChange = (key: string) => {
    if (key === 'learning') return;
    navigate(`${basePath}/${key}`);
  };

  const handleResourceTargetChange = (target: {
    resourceId?: string;
    resourceType?: string;
    resourceName?: string;
    viewer?: string;
  }) => {
    if (!target.resourceId) return;
    const outlineResource = findResourceNodeByResourceId(outlineNodes, target.resourceId);
    if (!outlineResource) return;
    navigate(`${basePath}/learning/${outlineResource.nodeId}`);
  };

  return (
    <div className={styles.root} data-chat-open={chatOpen || undefined}>
      <section className={styles.studyShell}>
        <aside className={styles.outlineSidebar}>
          <div className={styles.outlineHeader}>
            <div className={styles.courseRow}>
              <AppIconButton
                icon={<ArrowLeft size={18} aria-hidden />}
                label={t('nav.home')}
                onPress={() => navigate(`${basePath}/home`)}
              />
              <strong>{course.name}</strong>
              <AppIconButton
                icon={<LayoutGrid size={18} aria-hidden />}
                label={t('common.backToCourses')}
                onPress={() => navigate('/app/course')}
              />
            </div>
            <SegmentedTabs
              block
              size="sm"
              variant="pill"
              ariaLabel={t('outline.courseNavigation')}
              selectedKey="learning"
              onSelectionChange={handleCourseSectionChange}
              items={[
                { key: 'learning', label: t('home.learning') },
                { key: 'assignments', label: t('nav.assignments') },
                { key: 'materials', label: t('nav.materials') },
                { key: 'info', label: t('nav.infoShort') },
              ]}
            />
          </div>

          <div className={styles.outlineTools}>
            <Search size={17} aria-hidden />
            <Input
              aria-label={t('outline.searchPlaceholder')}
              placeholder={t('outline.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className={styles.outlineTree}>
            {loading ? <Spin tip={t('sidebar.loading')} /> : null}
            {error ? (
              <div className={styles.outlineState}>
                <span>{parseErrorMessage(error)}</span>
                <Button variant="secondary" size="sm" onPress={refresh}>
                  {t('common.retry')}
                </Button>
              </div>
            ) : null}
            {!loading && !error && visibleNodes.length === 0 ? (
              <div className={styles.outlineState}>{t('outline.empty')}</div>
            ) : null}
            {visibleNodes.length > 0 ? (
              <Tree
                blockNode
                treeData={toTreeData(visibleNodes)}
                selectedKeys={selectedNode ? [selectedNode.nodeId] : []}
                defaultExpandAll={Boolean(normalizedQuery)}
                defaultExpandedKeys={outlineNodes.slice(0, 2).map((node) => node.nodeId)}
                onSelect={handleTreeSelect}
              />
            ) : null}
          </div>

          <div className={styles.outlineProgress}>
            <div>
              <span>{t('home.courseProgress')}</span>
              <span>{courseProgress}%</span>
            </div>
            <ProgressBar aria-label={t('home.courseProgress')} value={courseProgress}>
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        </aside>

        <div className={styles.studyWorkspace}>
          <WorkspaceHeader
            inlineTitle={
              <span className={styles.workspaceTitle}>
                {selectedNode?.nodeType === 'RESOURCE' ? (
                  selectedNode.viewer === 'video' ? (
                    <Video size={18} aria-hidden />
                  ) : selectedNode.resourceType === 'note' ? (
                    <NotebookPen size={18} aria-hidden />
                  ) : (
                    <FileText size={18} aria-hidden />
                  )
                ) : (
                  <Folder size={18} aria-hidden />
                )}
                <span>{selectedNode?.title ?? course.name}</span>
              </span>
            }
            extra={
              selectedNode?.nodeType === 'RESOURCE' ? (
                <>
                  <Button
                    size="sm"
                    variant={selectedNode.read ? 'secondary' : 'primary'}
                    isDisabled={updatingRead}
                    onPress={() => updateRead(selectedNode.nodeId, !selectedNode.read)}
                  >
                    {selectedNode.read ? t('outline.markUnread') : t('outline.markRead')}
                  </Button>
                  <AppIconButton
                    icon={
                      chatPanelCollapsed ? (
                        <PanelRightOpen size={18} aria-hidden />
                      ) : (
                        <PanelRightClose size={18} aria-hidden />
                      )
                    }
                    label={chatPanelCollapsed ? t('learning.openChat') : t('learning.closeChat')}
                    onPress={() => setChatPanelCollapsed(!chatPanelCollapsed)}
                  />
                </>
              ) : undefined
            }
          />

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
                    courseGroupId={course.courseGroupId}
                    target={{
                      resourceId: selectedNode.resourceId,
                      resourceType: selectedNode.resourceType,
                      resourceName: selectedNode.title,
                      viewer: selectedNode.viewer,
                    }}
                    onTargetChange={handleResourceTargetChange}
                    onClose={() => navigate(`${basePath}/home`)}
                  />
                )
              ) : (
                <div className={styles.sectionOverview}>
                  <p>{t('outline.resourceCount', { count: selectedResources.length })}</p>
                  <div className={styles.resourceList}>
                    {selectedResources.map((resource) => (
                      <button
                        key={resource.nodeId}
                        type="button"
                        onClick={() => navigate(`${basePath}/learning/${resource.nodeId}`)}
                      >
                        {resource.viewer === 'video' ? (
                          <Video size={18} aria-hidden />
                        ) : resource.resourceType === 'note' ? (
                          <NotebookPen size={18} aria-hidden />
                        ) : (
                          <FileText size={18} aria-hidden />
                        )}
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

      {chatOpen ? (
        <aside className={styles.chatDock} aria-label={t('learning.chat')}>
          <ChatPanel />
        </aside>
      ) : null}
    </div>
  );
}

export default CourseLearningLayout;
