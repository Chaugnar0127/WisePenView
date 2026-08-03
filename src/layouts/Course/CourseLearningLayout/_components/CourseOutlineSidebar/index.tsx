import AppIconButton from '@/components/Button/AppIconButton';
import { Spin } from '@/components/Feedback';
import { Input } from '@/components/Input';
import Tree, { type DataNode } from '@/components/Tree';
import type { CourseOutlineNode } from '@/domains/Course';
import { parseErrorMessage } from '@/utils/error';
import { Button, Tabs } from '@heroui/react';
import { ArrowLeft, CheckCircle2, Circle, Folder, LayoutGrid, Search } from 'lucide-react';
import type { Key } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../style.module.less';
import CourseResourceIcon from '../CourseResourceIcon';

interface CourseOutlineSidebarProps {
  courseName: string;
  nodes: CourseOutlineNode[];
  selectedNodeId?: string;
  searchQuery: string;
  expandSearchResults: boolean;
  loading: boolean;
  error?: Error;
  onSearchQueryChange: (value: string) => void;
  onSelectNode: (nodeId: string) => void;
  onSelectCourseSection: (section: string) => void;
  onOpenCourseHome: () => void;
  onOpenCourseList: () => void;
  onRetry: () => void;
}

const toTreeData = (nodes: CourseOutlineNode[]): DataNode[] =>
  nodes.map((node) => {
    if (node.nodeType === 'RESOURCE') {
      return {
        key: node.nodeId,
        isLeaf: true,
        title: (
          <span className={styles.treeTitle}>
            <CourseResourceIcon node={node} size={15} />
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

function CourseOutlineSidebar(props: CourseOutlineSidebarProps) {
  const { t } = useTranslation('course');

  return (
    <aside className={styles.outlineSidebar}>
      <div className={styles.outlineHeader}>
        <div className={styles.courseRow}>
          <AppIconButton
            icon={<ArrowLeft size={18} aria-hidden />}
            label={t('nav.home')}
            onPress={props.onOpenCourseHome}
          />
          <strong>{props.courseName}</strong>
          <AppIconButton
            icon={<LayoutGrid size={18} aria-hidden />}
            label={t('common.backToCourses')}
            onPress={props.onOpenCourseList}
          />
        </div>
        <Tabs
          variant="secondary"
          className={styles.courseSectionTabs}
          selectedKey="learning"
          onSelectionChange={(key) => props.onSelectCourseSection(String(key))}
        >
          <Tabs.ListContainer>
            <Tabs.List
              className={styles.courseSectionTabsList}
              aria-label={t('outline.courseNavigation')}
            >
              {[
                { key: 'learning', label: t('home.learning') },
                { key: 'assignments', label: t('nav.assignments') },
                { key: 'materials', label: t('nav.materials') },
                { key: 'info', label: t('nav.infoShort') },
              ].map((item) => (
                <Tabs.Tab key={item.key} id={item.key} className={styles.courseSectionTab}>
                  {item.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      <div className={styles.outlineTools}>
        <Search size={17} aria-hidden />
        <Input
          aria-label={t('outline.searchPlaceholder')}
          placeholder={t('outline.searchPlaceholder')}
          value={props.searchQuery}
          onChange={(event) => props.onSearchQueryChange(event.target.value)}
        />
      </div>

      <div className={styles.outlineTree}>
        {props.loading ? <Spin tip={t('sidebar.loading')} /> : null}
        {props.error ? (
          <div className={styles.outlineState}>
            <span>{parseErrorMessage(props.error)}</span>
            <Button variant="secondary" size="sm" onPress={props.onRetry}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}
        {!props.loading && !props.error && props.nodes.length === 0 ? (
          <div className={styles.outlineState}>{t('outline.empty')}</div>
        ) : null}
        {props.nodes.length > 0 ? (
          <Tree
            blockNode
            treeData={toTreeData(props.nodes)}
            selectedKeys={props.selectedNodeId ? [props.selectedNodeId] : []}
            defaultExpandAll={props.expandSearchResults}
            defaultExpandedKeys={props.nodes.slice(0, 2).map((node) => node.nodeId)}
            onSelect={(_keys: Key[], info: { node: DataNode }) =>
              props.onSelectNode(String(info.node.key))
            }
          />
        ) : null}
      </div>
    </aside>
  );
}

export default CourseOutlineSidebar;
