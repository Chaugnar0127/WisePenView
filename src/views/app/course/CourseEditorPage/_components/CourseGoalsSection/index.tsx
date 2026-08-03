import { TextArea } from '@/components/Input';
import { Label, TextField } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import type { UpdateCourseEditorForm } from '../../model';
import styles from '../../style.module.less';

interface CourseGoalsSectionProps {
  value: string;
  onUpdate: UpdateCourseEditorForm;
}

function CourseGoalsSection({ value, onUpdate }: CourseGoalsSectionProps) {
  const { t } = useTranslation('course');

  return (
    <section id="course-editor-goals" className={styles.editorSection}>
      <div className={styles.sectionHead}>
        <div>
          <h2>{t('editor.goals.title')}</h2>
          <p>{t('editor.goals.description')}</p>
        </div>
      </div>
      <TextField value={value} onChange={(nextValue) => onUpdate('learningObjectives', nextValue)}>
        <Label>{t('editor.fields.goals')}</Label>
        <TextArea
          className={styles.courseTextArea}
          rows={3}
          placeholder={t('editor.fields.goalsPlaceholder')}
        />
      </TextField>
    </section>
  );
}

export default CourseGoalsSection;
