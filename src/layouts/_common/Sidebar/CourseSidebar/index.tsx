import { Spin } from '@/components/Feedback';
import Tree, { type TreeDataNode } from '@/components/Tree';
import { useCourseService } from '@/domains';
import type { CourseSummary } from '@/domains/Course';
import { useRequest } from 'ahooks';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './style.module.less';

function toCourseTreeData(courses: CourseSummary[]): TreeDataNode[] {
  return courses.map((course) => ({
    key: `course:${course.courseId}`,
    title: (
      <span className={styles.nodeTitle}>
        <span className={styles.nodeMain}>
          <span className={styles.nodeIcon} aria-hidden="true">
            <BookOpen size={16} />
          </span>
          <span className={styles.nodeLabel} title={course.name}>
            {course.name}
          </span>
        </span>
      </span>
    ),
    isLeaf: true,
  }));
}

function resolveSelectedKey(pathname: string): string[] {
  const courseMatch = pathname.match(/^\/app\/course\/([^/]+)/);
  return courseMatch ? [`course:${courseMatch[1]}`] : [];
}

function SidebarCourse() {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, loading } = useRequest(() => courseService.listMyCourses({ page: 1, size: 50 }));

  if (loading) {
    return (
      <div className={styles.state}>
        <Spin size="small" tip={t('sidebar.loading')} />
      </div>
    );
  }

  const treeData = toCourseTreeData(data?.list ?? []);

  return (
    <div className={styles.root}>
      {treeData.length > 0 ? (
        <Tree
          blockNode
          selectable
          className={styles.tree}
          treeData={treeData}
          selectedKeys={resolveSelectedKey(location.pathname)}
          onSelect={(_keys, info) => {
            const key = String(info.node.key);
            if (key.startsWith('course:')) {
              navigate(`/app/course/${key.slice('course:'.length)}/learning`);
            }
          }}
        />
      ) : (
        <div className={styles.state}>{t('sidebar.empty')}</div>
      )}
    </div>
  );
}

export default SidebarCourse;
