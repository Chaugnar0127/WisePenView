import { Spin } from '@/components/Feedback';
import { Input } from '@/components/Input';
import Tree, { type TreeDataNode } from '@/components/Tree';
import { useCourseService } from '@/domains';
import type { CourseOutlineNode, CourseSummary } from '@/domains/Course';
import { useRequest } from 'ahooks';
import { BookOpen, FileText, Folder } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './style.module.less';

interface CourseTreeRecord {
  course: CourseSummary;
  outline: CourseOutlineNode[];
}

function nodeMatches(node: CourseOutlineNode, query: string): boolean {
  if (node.title.toLocaleLowerCase().includes(query)) return true;
  return node.nodeType !== 'RESOURCE' && node.children.some((child) => nodeMatches(child, query));
}

function toOutlineTreeNodes(
  courseId: string,
  nodes: CourseOutlineNode[],
  query: string
): TreeDataNode[] {
  return nodes
    .filter((node) => !query || nodeMatches(node, query))
    .map((node) => ({
      key: `node:${courseId}:${node.nodeId}`,
      title: (
        <span className={styles.nodeTitle}>
          {node.nodeType === 'RESOURCE' ? <FileText size={14} /> : <Folder size={14} />}
          <span>{node.title}</span>
        </span>
      ),
      isLeaf: node.nodeType === 'RESOURCE',
      children:
        node.nodeType === 'RESOURCE'
          ? undefined
          : toOutlineTreeNodes(courseId, node.children, query),
    }));
}

function toCourseTreeData(records: CourseTreeRecord[], query: string): TreeDataNode[] {
  return records
    .filter(
      ({ course, outline }) =>
        !query ||
        course.name.toLocaleLowerCase().includes(query) ||
        outline.some((node) => nodeMatches(node, query))
    )
    .map(({ course, outline }) => ({
      key: `course:${course.courseId}`,
      title: (
        <span className={styles.nodeTitle}>
          <BookOpen size={14} />
          <span>{course.name}</span>
        </span>
      ),
      children: toOutlineTreeNodes(course.courseId, outline, query),
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
  const [query, setQuery] = useState('');

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

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const treeData = toCourseTreeData(data ?? [], normalizedQuery);

  return (
    <div className={styles.root}>
      <Input
        aria-label={t('outline.searchPlaceholder')}
        placeholder={t('outline.searchPlaceholder')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={styles.search}
      />
      {treeData.length > 0 ? (
        <div className={styles.treeScroll}>
          <Tree
            blockNode
            className={styles.tree}
            treeData={treeData}
            selectedKeys={resolveSelectedKey(location.pathname)}
            defaultExpandedKeys={normalizedQuery ? treeData.map((node) => node.key) : []}
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
        </div>
      ) : (
        <div className={styles.state}>{t('sidebar.empty')}</div>
      )}
    </div>
  );
}

export default SidebarCourse;
