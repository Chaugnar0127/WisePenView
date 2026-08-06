import { Input, TextArea } from '@/components/Input';
import { TOOLTIP_FOCUS_PASSTHROUGH_PROPS } from '@/layouts/_common/a11y/tooltipFocusPassthrough';
import { Button, Label, TextField, Tooltip } from '@heroui/react';
import { Pencil, Save } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseEditorForm, UpdateCourseEditorForm } from '../../model';
import styles from '../../style.module.less';

interface CourseBasicSectionProps {
  form: CourseEditorForm;
  saved: boolean;
  saving: boolean;
  coverUrl: string;
  onUpdate: UpdateCourseEditorForm;
  onSave: () => void;
  onChangeCover: () => void;
  onCoverImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

function CourseBasicSection({
  form,
  saved,
  saving,
  coverUrl,
  onUpdate,
  onSave,
  onChangeCover,
  onCoverImageError,
}: CourseBasicSectionProps) {
  const { t } = useTranslation('course');

  return (
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
          <Button variant="primary" isDisabled={saving || saved} onPress={onSave}>
            <Save size={16} aria-hidden />
            {t('editor.save')}
          </Button>
        </div>
      </div>
      <div className={styles.basicLayout}>
        <div className={styles.basicFields}>
          <TextField value={form.name} onChange={(value) => onUpdate('name', value)}>
            <Label>{t('editor.fields.name')}</Label>
            <Input />
          </TextField>
          <TextField value={form.term} onChange={(value) => onUpdate('term', value)}>
            <Label>{t('editor.fields.term')}</Label>
            <Input placeholder="2026-2027 春季" />
          </TextField>
          <TextField value={form.category} onChange={(value) => onUpdate('category', value)}>
            <Label>{t('editor.fields.category')}</Label>
            <Input placeholder={t('editor.fields.categoryPlaceholder')} />
          </TextField>
        </div>
        <div className={styles.coverField}>
          <span className={styles.coverLabel}>{t('editor.fields.cover')}</span>
          <Tooltip>
            <Tooltip.Trigger {...TOOLTIP_FOCUS_PASSTHROUGH_PROPS}>
              <button
                type="button"
                className={styles.coverButton}
                aria-label={t('editor.actions.changeCover')}
                onClick={onChangeCover}
              >
                <img
                  src={coverUrl}
                  alt={t('editor.fields.coverAlt', { name: form.name })}
                  onError={onCoverImageError}
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
        onChange={(value) => onUpdate('description', value)}
      >
        <Label>{t('editor.fields.description')}</Label>
        <TextArea className={styles.courseTextArea} rows={3} />
      </TextField>
    </section>
  );
}

export default CourseBasicSection;
