import AppIconButton from '@/components/Button/AppIconButton';
import { PieChart } from '@/components/Chart';
import { Input, TextArea, UploadZone } from '@/components/Input';
import AppModal from '@/components/Overlay/AppModal';
import { useCourseService, useImageService } from '@/domains';
import type {
  CourseAssessmentItem,
  CourseFinalAssessment,
  CourseMeeting,
  CoursePeriod,
  CourseWeekPattern,
} from '@/domains/Course';
import {
  COURSE_ROLE,
  createDefaultCourseAssessmentItems,
  FUDAN_COURSE_PERIODS,
  getCoursePeriodTimeRange,
  isCoursePeriod,
} from '@/domains/Course';
import { parseErrorMessage } from '@/utils/error';
import { PLACEHOLDER_IMAGE } from '@/utils/image/placeholder';
import { assertImageProxyUploadLimit } from '@/utils/image/uploadLimit';
import { Button, Label, ListBox, Select, TextField, toast, Tooltip } from '@heroui/react';
import { useRequest } from 'ahooks';
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useRef, useState, type SyntheticEvent, type UIEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCourseRouteContext } from './context';
import { CourseDateField, CourseDateRangeField, CourseTimeField } from './CourseEditorDateFields';
import styles from './CourseEditorPage.module.less';
import CourseOutlineEditor from './CourseOutlineEditor';
import CoursePermissionSection from './CoursePermissionSection';

interface CourseEditorForm {
  name: string;
  description: string;
  coverUrl: string;
  term: string;
  category: string;
  startAt: string;
  endAt: string;
  learningObjectives: string;
  meetings: CourseMeeting[];
  assessmentItems: CourseAssessmentEditorItem[];
  finalAssessment: CourseFinalAssessment;
  finalAssessmentDeadlineTime: string;
}

interface CourseAssessmentEditorItem extends CourseAssessmentItem {
  editorId: string;
}

const WEEK_PATTERNS: CourseWeekPattern[] = ['EVERY', 'ODD', 'EVEN'];
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const ASSESSMENT_TYPES: CourseFinalAssessment['type'][] = ['EXAM', 'PAPER', 'OTHER'];
const COURSE_EDITOR_SECTION_IDS = [
  'course-editor-basic',
  'course-editor-goals',
  'course-editor-schedule',
  'course-editor-assessment',
  'course-editor-outline',
  'course-editor-access',
] as const;

const createMeeting = (): CourseMeeting => ({
  meetingId: crypto.randomUUID(),
  weekPattern: 'EVERY',
  weekday: '周一',
  startPeriod: 1,
  endPeriod: 2,
  location: '',
});

const createAssessmentEditorItem = (item: CourseAssessmentItem): CourseAssessmentEditorItem => ({
  ...item,
  editorId: crypto.randomUUID(),
});

const getAssessmentTotal = (items: CourseAssessmentEditorItem[]) =>
  items.reduce(
    (sum, item) => sum + (Number.isFinite(item.weight) ? Math.max(0, item.weight) : 0),
    0
  );

function CourseEditorPage() {
  const { t } = useTranslation('course');
  const { course, refreshCourse } = useCourseRouteContext();
  const courseService = useCourseService();
  const imageService = useImageService();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('course-editor-basic');
  const [saved, setSaved] = useState(true);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [modalCoverFile, setModalCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>();
  const coverPreviewRequestRef = useRef(0);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const programmaticScrollTargetRef = useRef<string | null>(null);
  const programmaticScrollReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<CourseEditorForm>({
    name: course.name,
    description: course.description,
    coverUrl: course.coverUrl ?? '',
    term: course.term,
    category: course.category ?? '',
    startAt: course.startAt?.slice(0, 10) ?? '',
    endAt: course.endAt?.slice(0, 10) ?? '',
    learningObjectives: course.learningObjectives.join('\n'),
    meetings: course.meetings.length > 0 ? course.meetings : [createMeeting()],
    assessmentItems:
      course.assessmentItems.length > 0
        ? course.assessmentItems.map(createAssessmentEditorItem)
        : createDefaultCourseAssessmentItems().map(createAssessmentEditorItem),
    finalAssessment: course.finalAssessment ?? { type: 'EXAM' },
    finalAssessmentDeadlineTime: course.finalAssessment?.deadline?.split('T')[1] ?? '23:59',
  });
  const assessmentTotal = getAssessmentTotal(form.assessmentItems);
  const noFinalAssessmentValue = t('editor.assessment.noneValue');
  const hasNoFinalAssessment =
    form.finalAssessment.type === 'OTHER' &&
    form.finalAssessment.customName?.trim() === noFinalAssessmentValue;

  const { loading: saving, run: saveCourse } = useRequest(
    async () => {
      let coverUrl = form.coverUrl.trim() || undefined;
      if (coverFile) {
        const uploadResult = await imageService.uploadImage({
          file: coverFile,
          scene: 'PUBLIC_IMAGE_FOR_GROUP',
          bizTag: `groups/${course.courseId}`,
        });
        coverUrl = uploadResult.publicUrl;
      }
      await courseService.updateCourse({
        courseId: course.courseId,
        name: form.name.trim(),
        description: form.description.trim(),
        coverUrl,
        term: form.term.trim(),
        category: form.category.trim() || undefined,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
        learningObjectives: form.learningObjectives
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        meetings: form.meetings,
        assessmentItems: form.assessmentItems.map(({ label, weight }) => ({ label, weight })),
        finalAssessment: form.finalAssessment,
      });
      return coverUrl;
    },
    {
      manual: true,
      onSuccess: (coverUrl) => {
        coverPreviewRequestRef.current += 1;
        setCoverFile(null);
        setCoverPreview(coverUrl);
        setForm((current) => ({ ...current, coverUrl: coverUrl ?? '' }));
        setSaved(true);
        refreshCourse();
        toast.success(t('editor.saveSuccess'));
      },
      onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
    }
  );

  if (course.myRole !== COURSE_ROLE.TEACHER) {
    return <Navigate to={`/app/course/${course.courseId}/home`} replace />;
  }

  const updateForm = <K extends keyof CourseEditorForm>(key: K, value: CourseEditorForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const navigateToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const section = document.getElementById(sectionId);
    const scrollContainer = editorScrollRef.current;
    if (!section || !scrollContainer) return;

    const activationLine = scrollContainer.getBoundingClientRect().top + 32;
    if (programmaticScrollReleaseTimerRef.current) {
      clearTimeout(programmaticScrollReleaseTimerRef.current);
      programmaticScrollReleaseTimerRef.current = null;
    }
    if (Math.abs(section.getBoundingClientRect().top - activationLine) <= 4) {
      programmaticScrollTargetRef.current = null;
    } else {
      programmaticScrollTargetRef.current = sectionId;
      programmaticScrollReleaseTimerRef.current = setTimeout(() => {
        programmaticScrollTargetRef.current = null;
        programmaticScrollReleaseTimerRef.current = null;
      }, 800);
    }
    const sectionOffsetTop =
      section.getBoundingClientRect().top -
      scrollContainer.getBoundingClientRect().top +
      scrollContainer.scrollTop;
    scrollContainer.scrollTo({
      top: Math.max(0, sectionOffsetTop - 32),
      behavior: 'smooth',
    });
  };

  const handleEditorScroll = (event: UIEvent<HTMLElement>) => {
    const scrollContainer = event.currentTarget;
    const activationLine = scrollContainer.getBoundingClientRect().top + 32;

    const programmaticTarget = programmaticScrollTargetRef.current;
    if (programmaticTarget) {
      const targetSection = document.getElementById(programmaticTarget);
      const targetReached =
        targetSection && Math.abs(targetSection.getBoundingClientRect().top - activationLine) <= 4;
      if (targetReached) {
        programmaticScrollTargetRef.current = null;
        if (programmaticScrollReleaseTimerRef.current) {
          clearTimeout(programmaticScrollReleaseTimerRef.current);
          programmaticScrollReleaseTimerRef.current = null;
        }
      }
      return;
    }

    let nextSection: string = COURSE_EDITOR_SECTION_IDS[0];

    for (const sectionId of COURSE_EDITOR_SECTION_IDS) {
      const section = document.getElementById(sectionId);
      if (!section || section.getBoundingClientRect().top > activationLine) break;
      nextSection = sectionId;
    }

    setActiveSection((current) => (current === nextSection ? current : nextSection));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.term.trim()) {
      toast.warning(t('editor.required'));
      return;
    }
    saveCourse();
  };

  const handleCoverFileChange = (file: File | null) => {
    if (!file) {
      setModalCoverFile(null);
      return;
    }
    try {
      assertImageProxyUploadLimit(file);
      setModalCoverFile(file);
    } catch (error: unknown) {
      toast.danger(parseErrorMessage(error));
    }
  };

  const handleConfirmCover = () => {
    if (!modalCoverFile) return;
    setCoverFile(modalCoverFile);
    const requestId = coverPreviewRequestRef.current + 1;
    coverPreviewRequestRef.current = requestId;
    const reader = new FileReader();
    reader.onload = () => {
      if (requestId !== coverPreviewRequestRef.current || typeof reader.result !== 'string') return;
      setCoverPreview(reader.result);
      setSaved(false);
    };
    reader.readAsDataURL(modalCoverFile);
    setModalCoverFile(null);
    setCoverModalOpen(false);
  };

  const handleCoverModalOpenChange = (open: boolean) => {
    setCoverModalOpen(open);
    if (!open) setModalCoverFile(null);
  };

  const updateDeadlineDate = (value: string) => {
    updateForm('finalAssessment', {
      ...form.finalAssessment,
      deadline: value ? `${value}T${form.finalAssessmentDeadlineTime}` : undefined,
    });
  };

  const updateDeadlineTime = (value: string) => {
    const nextTime = value || '23:59';
    setForm((current) => {
      const deadlineDate = current.finalAssessment.deadline?.split('T')[0];
      return {
        ...current,
        finalAssessmentDeadlineTime: nextTime,
        finalAssessment: deadlineDate
          ? { ...current.finalAssessment, deadline: `${deadlineDate}T${nextTime}` }
          : current.finalAssessment,
      };
    });
    setSaved(false);
  };

  const handleCoverImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== PLACEHOLDER_IMAGE) {
      event.currentTarget.src = PLACEHOLDER_IMAGE;
    }
  };

  const updateMeeting = (meetingId: string, patch: Partial<CourseMeeting>) => {
    updateForm(
      'meetings',
      form.meetings.map((meeting) =>
        meeting.meetingId === meetingId ? { ...meeting, ...patch } : meeting
      )
    );
  };

  const updateAssessment = (editorId: string, patch: Partial<CourseAssessmentItem>) => {
    updateForm(
      'assessmentItems',
      form.assessmentItems.map((item) =>
        item.editorId === editorId ? { ...item, ...patch } : item
      )
    );
  };

  const infoNavItems = [
    ['course-editor-basic', t('editor.nav.basic')],
    ['course-editor-goals', t('editor.nav.goals')],
    ['course-editor-schedule', t('editor.nav.schedule')],
    ['course-editor-assessment', t('editor.nav.assessment')],
  ] as const;
  const finalAssessmentTypeField = (
    <Select
      className={styles.finalTypeField}
      variant="primary"
      value={form.finalAssessment.type}
      onChange={(value) => {
        if (typeof value !== 'string') return;
        updateForm('finalAssessment', { type: value as CourseFinalAssessment['type'] });
      }}
      aria-label={t('editor.fields.finalType')}
    >
      <Label>{t('editor.fields.finalType')}</Label>
      <Select.Trigger className={styles.finalTypeTrigger}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {ASSESSMENT_TYPES.map((item) => (
            <ListBox.Item key={item} id={item}>
              {t(`editor.finalType.${item}`)}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );

  return (
    <div className={styles.editorShell}>
      <header className={styles.editorHeader}>
        <AppIconButton
          icon={<ArrowLeft aria-hidden />}
          label={t('editor.back')}
          onPress={() => navigate(`/app/course/${course.courseId}/home`)}
        />
        <div>
          <strong>{course.name}</strong>
          <span>{t('editor.title')}</span>
        </div>
      </header>

      <div className={styles.editorBody}>
        <nav className={styles.editorNav} aria-label={t('editor.navigationAria')}>
          <h2>{t('editor.groups.info')}</h2>
          {infoNavItems.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={activeSection === id ? styles.active : undefined}
              onClick={() => navigateToSection(id)}
            >
              {label}
            </button>
          ))}
          <h2>{t('editor.groups.content')}</h2>
          <button
            type="button"
            className={activeSection === 'course-editor-outline' ? styles.active : undefined}
            onClick={() => navigateToSection('course-editor-outline')}
          >
            {t('editor.nav.outline')}
          </button>
          <h2>{t('editor.groups.management')}</h2>
          <button
            type="button"
            className={activeSection === 'course-editor-access' ? styles.active : undefined}
            onClick={() => navigateToSection('course-editor-access')}
          >
            {t('editor.nav.access')}
          </button>
        </nav>

        <main ref={editorScrollRef} className={styles.editorScroll} onScroll={handleEditorScroll}>
          <div className={styles.editorContent}>
            <section id="course-editor-basic" className={styles.editorSection}>
              <div className={styles.sectionHead}>
                <div>
                  <h2>{t('editor.basic.title')}</h2>
                  <p>{t('editor.basic.description')}</p>
                </div>
                <div className={styles.saveActions}>
                  <span className={saved ? styles.saved : styles.unsaved}>
                    {saved ? t('editor.saved') : t('editor.unsaved')}
                  </span>
                  <Button variant="primary" isDisabled={saving || saved} onPress={handleSave}>
                    <Save size={16} aria-hidden />
                    {t('editor.save')}
                  </Button>
                </div>
              </div>
              <div className={styles.basicLayout}>
                <div className={styles.basicFields}>
                  <TextField value={form.name} onChange={(value) => updateForm('name', value)}>
                    <Label>{t('editor.fields.name')}</Label>
                    <Input />
                  </TextField>
                  <TextField value={form.term} onChange={(value) => updateForm('term', value)}>
                    <Label>{t('editor.fields.term')}</Label>
                    <Input placeholder="2026-2027 春季" />
                  </TextField>
                  <TextField
                    value={form.category}
                    onChange={(value) => updateForm('category', value)}
                  >
                    <Label>{t('editor.fields.category')}</Label>
                    <Input placeholder={t('editor.fields.categoryPlaceholder')} />
                  </TextField>
                </div>
                <div className={styles.coverField}>
                  <span className={styles.coverLabel}>{t('editor.fields.cover')}</span>
                  <Tooltip>
                    <Tooltip.Trigger>
                      <button
                        type="button"
                        className={styles.coverButton}
                        aria-label={t('editor.actions.changeCover')}
                        onClick={() => handleCoverModalOpenChange(true)}
                      >
                        <img
                          src={coverPreview ?? (form.coverUrl || PLACEHOLDER_IMAGE)}
                          alt={t('editor.fields.coverAlt', { name: form.name })}
                          onError={handleCoverImageError}
                        />
                        <span>
                          <Pencil size={16} aria-hidden />
                        </span>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{t('editor.actions.changeCover')}</Tooltip.Content>
                  </Tooltip>
                </div>
              </div>
              <TextField
                className={styles.descriptionField}
                value={form.description}
                onChange={(value) => updateForm('description', value)}
              >
                <Label>{t('editor.fields.description')}</Label>
                <TextArea className={styles.courseTextArea} rows={3} />
              </TextField>
            </section>

            <section id="course-editor-goals" className={styles.editorSection}>
              <div className={styles.sectionHead}>
                <div>
                  <h2>{t('editor.goals.title')}</h2>
                  <p>{t('editor.goals.description')}</p>
                </div>
              </div>
              <TextField
                value={form.learningObjectives}
                onChange={(value) => updateForm('learningObjectives', value)}
              >
                <Label>{t('editor.fields.goals')}</Label>
                <TextArea
                  className={styles.courseTextArea}
                  rows={3}
                  placeholder={t('editor.fields.goalsPlaceholder')}
                />
              </TextField>
            </section>

            <section id="course-editor-schedule" className={styles.editorSection}>
              <div className={styles.sectionHead}>
                <div>
                  <h2>{t('editor.schedule.title')}</h2>
                  <p>{t('editor.schedule.description')}</p>
                </div>
              </div>
              <div className={styles.dateRangeField}>
                <CourseDateRangeField
                  label={t('editor.fields.coursePeriod')}
                  startValue={form.startAt}
                  endValue={form.endAt}
                  onChange={(startValue, endValue) => {
                    updateForm('startAt', startValue);
                    updateForm('endAt', endValue);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={!form.startAt && !form.endAt}
                  onPress={() => {
                    updateForm('startAt', '');
                    updateForm('endAt', '');
                  }}
                >
                  {t('editor.actions.clear')}
                </Button>
              </div>
              <div className={styles.subsectionHead}>
                <div>
                  <h3>{t('editor.schedule.meetings')}</h3>
                  <p>{t('editor.schedule.meetingsHint')}</p>
                </div>
                <Button
                  variant="secondary"
                  onPress={() => updateForm('meetings', [...form.meetings, createMeeting()])}
                >
                  <Plus size={16} aria-hidden />
                  {t('editor.actions.addMeeting')}
                </Button>
              </div>
              <div className={styles.meetingList}>
                <div className={styles.meetingColumns} aria-hidden>
                  <span>{t('editor.fields.weekPattern')}</span>
                  <span>{t('editor.fields.weekday')}</span>
                  <span>{t('editor.fields.startPeriod')}</span>
                  <span>{t('editor.fields.endPeriod')}</span>
                  <span>{t('editor.fields.periodTime')}</span>
                  <span>{t('editor.fields.location')}</span>
                  <span />
                </div>
                {form.meetings.map((meeting) => (
                  <div key={meeting.meetingId} className={styles.meetingRow}>
                    <Select
                      variant="secondary"
                      value={meeting.weekPattern}
                      onChange={(value) => {
                        if (typeof value !== 'string') return;
                        updateMeeting(meeting.meetingId, {
                          weekPattern: value as CourseWeekPattern,
                        });
                      }}
                      aria-label={t('editor.fields.weekPattern')}
                    >
                      <Select.Trigger className={styles.meetingControl}>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {WEEK_PATTERNS.map((item) => (
                            <ListBox.Item key={item} id={item}>
                              {t(`editor.weekPattern.${item}`)}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Select
                      variant="secondary"
                      value={meeting.weekday}
                      onChange={(value) => {
                        if (typeof value !== 'string') return;
                        updateMeeting(meeting.meetingId, { weekday: value });
                      }}
                      aria-label={t('editor.fields.weekday')}
                    >
                      <Select.Trigger className={styles.meetingControl}>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {WEEKDAYS.map((item) => (
                            <ListBox.Item key={item} id={item}>
                              {item}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Select
                      variant="secondary"
                      value={String(meeting.startPeriod)}
                      onChange={(value) => {
                        const startPeriod = Number(value);
                        if (!isCoursePeriod(startPeriod)) return;
                        const endPeriod = Math.max(startPeriod, meeting.endPeriod) as CoursePeriod;
                        updateMeeting(meeting.meetingId, { startPeriod, endPeriod });
                      }}
                      aria-label={t('editor.fields.startPeriod')}
                    >
                      <Select.Trigger className={styles.meetingControl}>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {FUDAN_COURSE_PERIODS.map(({ period }) => (
                            <ListBox.Item key={period} id={String(period)}>
                              {t('editor.fields.periodOption', { period })}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Select
                      variant="secondary"
                      value={String(meeting.endPeriod)}
                      onChange={(value) => {
                        const endPeriod = Number(value);
                        if (!isCoursePeriod(endPeriod)) return;
                        updateMeeting(meeting.meetingId, { endPeriod });
                      }}
                      aria-label={t('editor.fields.endPeriod')}
                    >
                      <Select.Trigger className={styles.meetingControl}>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {FUDAN_COURSE_PERIODS.filter(
                            ({ period }) => period >= meeting.startPeriod
                          ).map(({ period }) => (
                            <ListBox.Item key={period} id={String(period)}>
                              {t('editor.fields.periodOption', { period })}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <span className={styles.meetingTime}>
                      {getCoursePeriodTimeRange(meeting.startPeriod, meeting.endPeriod)}
                    </span>
                    <Input
                      className={styles.meetingControl}
                      value={meeting.location}
                      placeholder={t('editor.fields.location')}
                      aria-label={t('editor.fields.location')}
                      onChange={(event) =>
                        updateMeeting(meeting.meetingId, { location: event.target.value })
                      }
                    />
                    <AppIconButton
                      icon={<Trash2 aria-hidden />}
                      label={t('editor.actions.deleteMeeting')}
                      variant="danger"
                      onPress={() =>
                        updateForm(
                          'meetings',
                          form.meetings.filter((item) => item.meetingId !== meeting.meetingId)
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </section>

            <section id="course-editor-assessment" className={styles.editorSection}>
              <div className={styles.sectionHead}>
                <div>
                  <h2>{t('editor.assessment.title')}</h2>
                  <p>{t('editor.assessment.description')}</p>
                </div>
              </div>
              <div className={styles.assessmentWorkbench}>
                <div className={styles.assessmentEditor}>
                  <div className={styles.assessmentColumns}>
                    <span>{t('editor.fields.assessmentName')}</span>
                    <span>{t('editor.fields.weight')}</span>
                  </div>
                  <div className={styles.assessmentList}>
                    {form.assessmentItems.map((item) => (
                      <div key={item.editorId} className={styles.assessmentRow}>
                        <Input
                          value={item.label}
                          aria-label={t('editor.fields.assessmentName')}
                          onChange={(event) =>
                            updateAssessment(item.editorId, { label: event.target.value })
                          }
                        />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={String(item.weight)}
                          aria-label={t('editor.fields.weight')}
                          onChange={(event) =>
                            updateAssessment(item.editorId, { weight: Number(event.target.value) })
                          }
                        />
                        <AppIconButton
                          icon={<Trash2 aria-hidden />}
                          label={t('editor.actions.deleteAssessment')}
                          variant="danger"
                          onPress={() =>
                            updateForm(
                              'assessmentItems',
                              form.assessmentItems.filter(
                                (assessment) => assessment.editorId !== item.editorId
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    onPress={() =>
                      updateForm('assessmentItems', [
                        ...form.assessmentItems,
                        createAssessmentEditorItem({ label: '', weight: 0 }),
                      ])
                    }
                  >
                    <Plus size={16} aria-hidden />
                    {t('editor.actions.addAssessment')}
                  </Button>
                </div>
                <PieChart
                  items={form.assessmentItems.map((item) => ({
                    id: item.editorId,
                    label: item.label.trim() || t('editor.assessment.unnamed'),
                    value: item.weight,
                  }))}
                  targetValue={100}
                  title={t('editor.assessment.chartTitle')}
                  description={t('editor.assessment.chartDescription')}
                  unallocatedLabel={t('editor.assessment.unallocated')}
                  emptyLabel={t('editor.assessment.unallocated')}
                  valueFormatter={(value) => `${value}%`}
                  ariaLabel={t('editor.assessment.chartAria', { total: assessmentTotal })}
                />
              </div>
              <div className={styles.finalAssessment}>
                <div className={styles.subsectionHead}>
                  <div>
                    <h3>{t('editor.assessment.final')}</h3>
                    <p>{t('editor.assessment.finalDescription')}</p>
                  </div>
                </div>
                {finalAssessmentTypeField}
                {form.finalAssessment.type === 'EXAM' ? (
                  <div className={styles.finalExamFields}>
                    <TextField
                      value={form.finalAssessment.examForm ?? ''}
                      onChange={(value) =>
                        updateForm('finalAssessment', {
                          ...form.finalAssessment,
                          examForm: value,
                        })
                      }
                    >
                      <Label>{t('editor.fields.examForm')}</Label>
                      <Input placeholder={t('editor.fields.examFormPlaceholder')} />
                    </TextField>
                    <TextField
                      value={form.finalAssessment.location ?? ''}
                      onChange={(value) =>
                        updateForm('finalAssessment', {
                          ...form.finalAssessment,
                          location: value,
                        })
                      }
                    >
                      <Label>{t('editor.fields.examLocation')}</Label>
                      <Input />
                    </TextField>
                    <CourseDateField
                      label={t('editor.fields.examDate')}
                      value={form.finalAssessment.date ?? ''}
                      onChange={(value) =>
                        updateForm('finalAssessment', { ...form.finalAssessment, date: value })
                      }
                    />
                    <div className={styles.finalTimeFields}>
                      <CourseTimeField
                        label={t('editor.fields.startTime')}
                        value={form.finalAssessment.startTime ?? ''}
                        onChange={(value) =>
                          updateForm('finalAssessment', {
                            ...form.finalAssessment,
                            startTime: value,
                          })
                        }
                      />
                      <CourseTimeField
                        label={t('editor.fields.endTime')}
                        value={form.finalAssessment.endTime ?? ''}
                        onChange={(value) =>
                          updateForm('finalAssessment', {
                            ...form.finalAssessment,
                            endTime: value,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className={styles.finalDeadlineFields}>
                    {form.finalAssessment.type === 'OTHER' ? (
                      <TextField
                        className={styles.finalCustomName}
                        value={form.finalAssessment.customName ?? ''}
                        onChange={(value) =>
                          updateForm('finalAssessment', {
                            ...form.finalAssessment,
                            customName: value,
                            deadline:
                              value.trim() === noFinalAssessmentValue
                                ? undefined
                                : form.finalAssessment.deadline,
                          })
                        }
                      >
                        <Label>{t('editor.fields.customAssessment')}</Label>
                        <Input placeholder={t('editor.fields.customAssessmentPlaceholder')} />
                      </TextField>
                    ) : null}
                    {!hasNoFinalAssessment ? (
                      <>
                        <CourseDateField
                          label={t('editor.fields.deadlineDate')}
                          value={form.finalAssessment.deadline?.split('T')[0] ?? ''}
                          onChange={updateDeadlineDate}
                        />
                        <CourseTimeField
                          label={t('editor.fields.deadlineTime')}
                          value={form.finalAssessmentDeadlineTime}
                          onChange={updateDeadlineTime}
                        />
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            <section id="course-editor-outline" className={styles.editorSection}>
              <CourseOutlineEditor courseId={course.courseId} />
            </section>

            <section id="course-editor-access" className={styles.editorSection}>
              <div className={styles.sectionHead}>
                <div>
                  <h2>{t('editor.permissions.title')}</h2>
                  <p>{t('editor.permissions.description')}</p>
                </div>
              </div>
              <CoursePermissionSection courseId={course.courseId} onSuccess={refreshCourse} />
            </section>
          </div>
        </main>
      </div>
      <AppModal
        isOpen={coverModalOpen}
        onOpenChange={handleCoverModalOpenChange}
        title={t('editor.actions.changeCover')}
        actions={
          <>
            <Button variant="secondary" onPress={() => handleCoverModalOpenChange(false)}>
              {t('editor.actions.cancel')}
            </Button>
            <Button variant="primary" isDisabled={!modalCoverFile} onPress={handleConfirmCover}>
              {t('editor.actions.confirm')}
            </Button>
          </>
        }
      >
        <UploadZone
          file={modalCoverFile}
          accept="image/*"
          label={t('editor.fields.coverUpload')}
          onFileChange={handleCoverFileChange}
        />
      </AppModal>
    </div>
  );
}

export default CourseEditorPage;
