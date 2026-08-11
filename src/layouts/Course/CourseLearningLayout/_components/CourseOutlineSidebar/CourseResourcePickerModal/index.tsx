import { AppButton } from '@/components/Button';
import DriveNavigator from '@/components/Drive/DriveNavigator';
import type { DriveSelectionItem } from '@/components/Drive/common/driveComponentModel';
import AppModal from '@/components/Overlay/AppModal';
import { usePickerSelection } from '@/components/Picker';
import { useCourseService } from '@/domains';
import type { CourseOutlineMountResource } from '@/domains/Course';
import { useApi } from '@/hooks/useApi';
import { toast } from '@heroui/react';

import { useTranslation } from 'react-i18next';
import styles from './style.module.less';

interface CourseResourcePickerModalProps {
  isOpen: boolean;
  courseId: string;
  targetNodeId: string;
  targetName: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CourseResourcePickerModal({
  isOpen,
  courseId,
  targetNodeId,
  targetName,
  onOpenChange,
  onSuccess,
}: CourseResourcePickerModalProps) {
  const { t } = useTranslation('course');
  const courseService = useCourseService();
  const selection = usePickerSelection<CourseOutlineMountResource[]>({
    initialValue: [],
    getCount: (value) => value.length,
  });

  const close = () => {
    selection.clear();
    onOpenChange(false);
  };

  const { loading, run: mountResources } = useApi(
    () =>
      courseService.mountCourseOutlineResources({
        courseId,
        targetNodeId,
        resources: selection.value,
      }),
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('editor.outline.mountSuccess', { count: selection.count }));
        onSuccess();
        close();
      },
    }
  );

  const handleSelectionChange = (items: DriveSelectionItem[]) => {
    selection.setValue(
      items
        .filter((item) => item.kind === 'resource' || item.kind === 'link')
        .filter((item) => Boolean(item.resourceId))
        .map((item) => ({
          resourceId: item.resourceId ?? '',
          name: item.label,
          resourceType: item.resourceType ?? '',
        }))
    );
  };

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) close();
      }}
      title={t('editor.outline.cloudPickerTitle')}
      description={t('editor.outline.cloudPickerDescription', { name: targetName })}
      size="md"
      isDismissable={!loading}
      actions={
        <>
          <AppButton variant="secondary" isDisabled={loading} onPress={close}>
            {t('editor.actions.cancel')}
          </AppButton>
          <AppButton
            variant="primary"
            isDisabled={loading || !selection.canConfirm}
            onPress={mountResources}
          >
            {t('editor.outline.mountSelected', { count: selection.count })}
          </AppButton>
        </>
      }
    >
      <div className={styles.resourcePickerBody}>
        <DriveNavigator
          scope={{ type: 'personal' }}
          selectableTypes={['resource', 'link']}
          multiple
          disabled={loading}
          onChange={handleSelectionChange}
        />
      </div>
    </AppModal>
  );
}

export default CourseResourcePickerModal;
