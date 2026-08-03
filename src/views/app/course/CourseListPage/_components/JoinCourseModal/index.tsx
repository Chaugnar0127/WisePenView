import { Input } from '@/components/Input';
import { AppFormDialog } from '@/components/Overlay';
import { useCourseService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { Label, TextField, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface JoinCourseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: () => void;
}

function JoinCourseModal({ isOpen, onOpenChange, onJoined }: JoinCourseModalProps) {
  const { t } = useTranslation(['course', 'group']);
  const courseService = useCourseService();
  const [inviteCode, setInviteCode] = useState('');
  const request = useRequest(() => courseService.joinCourse({ inviteCode: inviteCode.trim() }), {
    manual: true,
    onSuccess: () => {
      toast.success(t('join.success'));
      setInviteCode('');
      onOpenChange(false);
      onJoined();
    },
    onError: (error: unknown) => toast.danger(parseErrorMessage(error)),
  });

  const handleSubmit = () => {
    if (!inviteCode.trim()) {
      toast.warning(t('join.required'));
      return;
    }
    request.run();
  };

  return (
    <AppFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('join.title')}
      description={t('join.description')}
      confirmText={t('list.join')}
      isSubmitting={request.loading}
      onSubmit={handleSubmit}
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
  );
}

export default JoinCourseModal;
