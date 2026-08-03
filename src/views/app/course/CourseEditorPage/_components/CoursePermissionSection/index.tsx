import { useGroupService } from '@/domains';
import GroupDefaultAccessPermissionModal from '@/views/app/group/_components/GroupPermissions/GroupDefaultAccessPermissionModal';
import GroupMountPermissionModal from '@/views/app/group/_components/GroupPermissions/GroupMountPermissionModal';
import { Button, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { FolderInput, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../style.module.less';

interface CoursePermissionSectionProps {
  courseId: string;
  onSuccess: () => void;
}

function CoursePermissionSection({ courseId, onSuccess }: CoursePermissionSectionProps) {
  const { t } = useTranslation(['course', 'group']);
  const groupService = useGroupService();
  const [accessPermissionOpen, setAccessPermissionOpen] = useState(false);
  const [mountPermissionOpen, setMountPermissionOpen] = useState(false);
  const {
    data: groupResConfig,
    loading,
    refresh,
  } = useRequest(() => groupService.fetchGroupResConfig(courseId), {
    refreshDeps: [courseId],
    onError: () => toast.danger(t('editor.permissions.loadFailed')),
  });

  const handlePermissionSuccess = () => {
    refresh();
    onSuccess();
  };

  return (
    <>
      <div className={styles.permissionActions}>
        <Button
          variant="secondary"
          isDisabled={loading || !groupResConfig}
          onPress={() => setAccessPermissionOpen(true)}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          {t('editor.permissions.access')}
        </Button>
        <Button variant="secondary" onPress={() => setMountPermissionOpen(true)}>
          <FolderInput size={16} aria-hidden="true" />
          {t('editor.permissions.mount')}
        </Button>
      </div>

      {groupResConfig ? (
        <GroupDefaultAccessPermissionModal
          isOpen={accessPermissionOpen}
          groupId={courseId}
          groupResConfig={groupResConfig}
          onOpenChange={setAccessPermissionOpen}
          onSuccess={handlePermissionSuccess}
        />
      ) : null}
      <GroupMountPermissionModal
        isOpen={mountPermissionOpen}
        onOpenChange={setMountPermissionOpen}
      />
    </>
  );
}

export default CoursePermissionSection;
