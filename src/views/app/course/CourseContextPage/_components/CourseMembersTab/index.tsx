import { DataTable, type DataTableColumn } from '@/components/Table';
import { useCourseService } from '@/domains';
import type { CourseMember } from '@/domains/Course';
import { useCourseContext } from '@/layouts/Course/CourseContext';
import { Chip } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import sharedStyles from '../../_styles/contextTab.module.less';
import styles from './style.module.less';

function CourseMembersTab() {
  const { t } = useTranslation('course');
  const { course } = useCourseContext();
  const courseService = useCourseService();
  const { data, loading } = useRequest(() =>
    courseService.listCourseMembers({ courseId: course.courseId, page: 1, size: 100 })
  );

  const columns: DataTableColumn<CourseMember>[] = [
    {
      id: 'member',
      label: t('members.columns.member'),
      width: 'lg',
      align: 'start',
      isRowHeader: true,
      renderCell: (member) => (
        <DataTable.MemberCell name={member.name} avatarSrc={member.avatar?.trim() || undefined} />
      ),
    },
    {
      id: 'studentNumber',
      label: t('members.columns.studentNumber'),
      width: 'md',
      align: 'start',
      renderCell: (member) => (
        <DataTable.TextCell muted>{member.studentNumber ?? '-'}</DataTable.TextCell>
      ),
    },
    {
      id: 'email',
      label: t('members.columns.email'),
      width: 'fill',
      align: 'start',
      renderCell: (member) => (
        <DataTable.TextCell title={member.email}>{member.email}</DataTable.TextCell>
      ),
    },
    {
      id: 'role',
      label: t('members.columns.role'),
      width: 'sm',
      align: 'center',
      renderCell: (member) => (
        <Chip size="sm" variant="soft">
          <Chip.Label>{t(`role.${member.role}`)}</Chip.Label>
        </Chip>
      ),
    },
  ];

  return (
    <div className={`${sharedStyles.page} ${styles.page}`}>
      <header className={sharedStyles.pageHeader}>
        <h2>{t('members.title')}</h2>
        <span>{t('members.count', { count: data?.total ?? 0 })}</span>
      </header>
      <DataTable<CourseMember>
        ariaLabel={t('members.tableAria')}
        items={data?.members ?? []}
        rowKey="userId"
        columns={columns}
        loading={loading}
        emptyText={t('members.empty')}
        summary={null}
        className={styles.memberTable}
      />
    </div>
  );
}

export default CourseMembersTab;
