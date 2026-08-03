import { getGroupDisplayConfig } from '@/components/Group/GroupDisplayConfig';
import MemberList from '@/components/Group/MemberList';
import { DataTable, type DataTableColumn } from '@/components/Table';
import { useCourseService, useGroupService } from '@/domains';
import type { CourseMember } from '@/domains/Course';
import { COURSE_ROLE } from '@/domains/Course';
import { GROUP_TYPE } from '@/domains/Group';
import { useCourseContext } from '@/layouts/Course/CourseContext';
import { Chip } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import sharedStyles from '../_styles/contextPage.module.less';
import styles from './style.module.less';

interface CourseMembersViewProps {
  courseId: string;
}

const TEACHER_MEMBER_MANAGEMENT_CONFIG = getGroupDisplayConfig(GROUP_TYPE.ADVANCED, 'OWNER');

function TeacherCourseMembersView({ courseId }: CourseMembersViewProps) {
  const { t } = useTranslation('course');
  const groupService = useGroupService();
  const { data: group } = useRequest(() => groupService.fetchGroupInfo(courseId), {
    refreshDeps: [courseId],
  });

  return (
    <div className={`${sharedStyles.page} ${styles.page}`}>
      <header className={sharedStyles.pageHeader}>
        <h2>{t('members.title')}</h2>
      </header>
      <div className={styles.memberManagement}>
        <MemberList
          groupDisplayConfig={TEACHER_MEMBER_MANAGEMENT_CONFIG}
          groupId={courseId}
          inviteCode={group?.inviteCode}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 20, 50],
            showSizeChanger: true,
          }}
        />
      </div>
    </div>
  );
}

function StudentCourseMembersView({ courseId }: CourseMembersViewProps) {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const { data, loading } = useRequest(() =>
    courseService.listCourseMembers({ courseId, page: 1, size: 100 })
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

function CourseMembersPage() {
  const { course } = useCourseContext();
  return course.myRole === COURSE_ROLE.TEACHER ? (
    <TeacherCourseMembersView courseId={course.courseId} />
  ) : (
    <StudentCourseMembersView courseId={course.courseId} />
  );
}

export default CourseMembersPage;
