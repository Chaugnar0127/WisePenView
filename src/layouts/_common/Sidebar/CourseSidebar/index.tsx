import { Spin } from '@/components/Feedback';
import EntryIcon from '@/components/Icons/EntryIcon';
import Tree, { type TreeDataNode } from '@/components/Tree';
import { useCourseService } from '@/domains';
import type { CourseOutlineNode, CourseSummary } from '@/domains/Course';
import { useRequest } from 'ahooks';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './style.module.less';

interface CourseTreeRecord {
  course: CourseSummary;
  outline: CourseOutlineNode[];
}

function toOutlineTreeNodes(courseId: string, nodes: CourseOutlineNode[]): TreeDataNode[] {
  return nodes.map((node) => ({
    key: `node:${courseId}:${node.nodeId}`,
    title: (
      <span className={styles.nodeTitle}>
        <span className={styles.nodeMain}>
          <span className={styles.nodeIcon} aria-hidden="true">
            <EntryIcon
              entryType={node.nodeType === 'RESOURCE' ? 'resource' : 'folder'}
              resourceType={node.nodeType === 'RESOURCE' ? node.resourceType : undefined}
              size={16}
            />
          </span>
          <span className={styles.nodeLabel} title={node.title}>
            {node.title}
          </span>
        </span>
      </span>
    ),
    isLeaf: node.nodeType === 'RESOURCE',
    children:
      node.nodeType === 'RESOURCE' ? undefined : toOutlineTreeNodes(courseId, node.children),
  }));
}

function toCourseTreeData(records: CourseTreeRecord[]): TreeDataNode[] {
  return records.map(({ course, outline }) => ({
    key: `course:${course.courseId}`,
    title: (
      <span className={styles.nodeTitle}>
        <span className={`${styles.nodeMain} ${styles.nodeMainRoot}`}>
          <span className={styles.nodeIcon} aria-hidden="true">
            <BookOpen size={16} />
          </span>
          <span className={styles.nodeLabel} title={course.name}>
            {course.name}
          </span>
        </span>
      </span>
    ),
    children: toOutlineTreeNodes(course.courseId, outline),
  }));
}

function resolveSelectedKey(pathname: string): string[] {
  const learningMatch = pathname.match(/^\/app\/course\/([^/]+)\/learning\/([^/]+)/);
  if (learningMatch) return [`node:${learningMatch[1]}:${learningMatch[2]}`];
  const courseMatch = pathname.match(/^\/app\/course\/([^/]+)/);
  return courseMatch ? [`course:${courseMatch[1]}`] : [];
}

function SidebarCourse() {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, loading } = useRequest(async () => {
    const coursePage = await courseService.listMyCourses({ page: 1, size: 50 });
    return Promise.all(
      coursePage.list.map(async (course) => {
        const outline = await courseService.getCourseOutline(course.courseId);
        return { course, outline: outline.nodes };
      })
    );
  });

  if (loading) {
    return (
      <div className={styles.state}>
        <Spin size="small" tip={t('sidebar.loading')} />
      </div>
    );
  }

  const treeData = toCourseTreeData(data ?? []);

  return (
    <div className={styles.root}>
      {treeData.length > 0 ? (
        <Tree
          blockNode
          selectable
          expandAction="click"
          className={styles.tree}
          treeData={treeData}
          selectedKeys={resolveSelectedKey(location.pathname)}
          onSelect={(_keys, info) => {
            const key = String(info.node.key);
            if (key.startsWith('course:')) {
              navigate(`/app/course/${key.slice('course:'.length)}/home`);
              return;
            }
            const match = key.match(/^node:([^:]+):(.+)$/);
            if (match) navigate(`/app/course/${match[1]}/learning/${match[2]}`);
          }}
        />
      ) : (
        <div className={styles.state}>{t('sidebar.empty')}</div>
      )}
    </div>
  );
}

export default SidebarCourse;
