import { DataTable, type DataTableColumn } from '@/components/Table';
import { useCourseService } from '@/domains';
import type { CourseMember } from '@/domains/Course';
import { Chip } from '@heroui/react';
import { useRequest } from 'ahooks';
import { MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCourseRouteContext } from './context';
import styles from './CourseContextPages.module.less';

export function CourseInfoPage() {
  const { t } = useTranslation('course');
  const { course } = useCourseRouteContext();

  return (
    <div className={styles.page}>
      <section>
        <h2>{t('info.intro')}</h2>
        <p>{course.description}</p>
      </section>
      <section>
        <h2>{t('info.goals')}</h2>
        <p>{t('info.goalsContent')}</p>
      </section>
      <section>
        <h2>{t('info.assessment')}</h2>
        <p>{t('info.assessmentContent')}</p>
      </section>
    </div>
  );
}

export function CourseMembersPage() {
  const { t } = useTranslation('course');
  const { course } = useCourseRouteContext();
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
    <div className={`${styles.page} ${styles.membersPage}`}>
      <header className={styles.pageHeader}>
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

export function CourseDiscussionPage() {
  const { t } = useTranslation('course');

  return (
    <div className={styles.discussionState}>
      <MessageSquareText size={30} aria-hidden />
      <h2>{t('discussion.title')}</h2>
      <p>{t('discussion.placeholder')}</p>
    </div>
  );
}
