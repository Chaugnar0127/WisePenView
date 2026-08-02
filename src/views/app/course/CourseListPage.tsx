import { Input, TextArea } from '@/components/Input';
import { AppFormDialog, AppModal } from '@/components/Overlay';
import { useCourseService, useUserService } from '@/domains';
import type { CourseSummary } from '@/domains/Course';
import { IDENTITY } from '@/domains/User';
import { parseErrorMessage } from '@/utils/error';
import { Button, Label, TextField, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { CirclePlus, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';
import styles from './CourseListPage.module.less';

interface CourseCreateForm {
  name: string;
  description: string;
  term: string;
}

const EMPTY_COURSE: CourseCreateForm = { name: '', description: '', term: '' };

function CourseListPage() {
  const { t } = useTranslation(['course', 'group', 'common']);
  const courseService = useCourseService();
  const userService = useUserService();
  const navigate = useNavigate();
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [courseForm, setCourseForm] = useState<CourseCreateForm>(EMPTY_COURSE);

  const { data, loading, error, refresh } = useRequest(() =>
    courseService.listMyCourses({ page: 1, size: 50 })
  );
  const { data: currentUser } = useRequest(() => userService.getUserInfo());
  const canCreateCourse =
    currentUser !== undefined && currentUser.identityType !== IDENTITY.STUDENT;
  const { loading: joining, run: joinCourse } = useRequest(
    () => courseService.joinCourse({ inviteCode: inviteCode.trim() }),
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('join.success'));
        setInviteCode('');
        setJoinOpen(false);
        refresh();
      },
      onError: (requestError: unknown) => toast.danger(parseErrorMessage(requestError)),
    }
  );
  const { loading: creating, run: createCourse } = useRequest(
    () =>
      courseService.createCourse({
        name: courseForm.name.trim(),
        description: courseForm.description.trim(),
        term: courseForm.term.trim(),
      }),
    {
      manual: true,
      onSuccess: (courseId) => {
        toast.success(t('create.success'));
        setCourseForm(EMPTY_COURSE);
        setCreateOpen(false);
        navigate(`/app/course/${courseId}/home`);
      },
      onError: (requestError: unknown) => toast.danger(parseErrorMessage(requestError)),
    }
  );

  const handleJoin = () => {
    if (!inviteCode.trim()) {
      toast.warning(t('join.required'));
      return;
    }
    joinCourse();
  };

  const handleCreate = () => {
    if (!courseForm.name.trim() || !courseForm.description.trim() || !courseForm.term.trim()) {
      toast.warning(t('create.required'));
      return;
    }
    createCourse();
  };

  const handleCourseClick = (course: CourseSummary) => {
    navigate(`/app/course/${course.courseId}/home`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('list.title')}</h1>
          <span className={styles.subtitle}>{t('list.subtitle')}</span>
        </div>
        <div className={styles.headerActions}>
          <Button onPress={() => setJoinOpen(true)}>
            <LogIn size={17} aria-hidden />
            {t('list.join')}
          </Button>
          {canCreateCourse ? (
            <Button variant="primary" onPress={() => setCreateOpen(true)}>
              <CirclePlus size={17} aria-hidden />
              {t('list.create')}
            </Button>
          ) : null}
        </div>
      </header>

      {loading ? <div className={styles.state}>{t('sidebar.loading')}</div> : null}
      {error ? (
        <div className={styles.state}>
          <span>{parseErrorMessage(error)}</span>
          <Button variant="secondary" onPress={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}
      {!loading && !error && data?.list.length === 0 ? (
        <div className={styles.state}>{t('list.empty')}</div>
      ) : null}

      {data?.list.length ? (
        <div className={styles.courseGrid}>
          {data.list.map((course) => (
            <div key={course.courseId} className={styles.courseGridItem}>
              <CourseCard course={course} onClick={handleCourseClick} />
            </div>
          ))}
        </div>
      ) : null}

      <AppFormDialog
        isOpen={joinOpen}
        onOpenChange={setJoinOpen}
        title={t('join.title')}
        description={t('join.description')}
        confirmText={t('list.join')}
        isSubmitting={joining}
        onSubmit={handleJoin}
      >
        <TextField
          value={inviteCode}
          onChange={setInviteCode}
          aria-label={t('join.inviteCode')}
          isRequired
        >
          <Label>{t('join.inviteCode')}</Label>
          <Input autoFocus placeholder={t('join.placeholder')} />
        </TextField>
      </AppFormDialog>

      <AppModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title={t('create.title')}
        description={t('create.description')}
        size="md"
        isDismissable={!creating}
        actions={
          <>
            <Button variant="secondary" isDisabled={creating} onPress={() => setCreateOpen(false)}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button variant="primary" isDisabled={creating} onPress={handleCreate}>
              {t('create.confirm')}
            </Button>
          </>
        }
      >
        <div className={styles.createForm}>
          <TextField
            value={courseForm.name}
            onChange={(name) => setCourseForm((current) => ({ ...current, name }))}
            aria-label={t('create.name')}
            isRequired
          >
            <Label>{t('create.name')}</Label>
            <Input placeholder={t('create.namePlaceholder')} />
          </TextField>
          <TextField
            value={courseForm.description}
            onChange={(description) => setCourseForm((current) => ({ ...current, description }))}
            aria-label={t('create.intro')}
            isRequired
          >
            <Label>{t('create.intro')}</Label>
            <TextArea rows={4} placeholder={t('create.introPlaceholder')} />
          </TextField>
          <TextField
            value={courseForm.term}
            onChange={(term) => setCourseForm((current) => ({ ...current, term }))}
            aria-label={t('create.term')}
            isRequired
          >
            <Label>{t('create.term')}</Label>
            <Input placeholder={t('create.termPlaceholder')} />
          </TextField>
        </div>
      </AppModal>
    </div>
  );
}

export default CourseListPage;
