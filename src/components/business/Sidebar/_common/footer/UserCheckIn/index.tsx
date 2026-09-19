import { useInterval } from 'ahooks';
import { CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AppModal from '@/components/base/AppModal';
import { AppButton, AppIconButton } from '@/components/base/Button';
import { useUserService } from '@/domains';
import type { UserTaskCheckInResult, UserTaskRewardPreview } from '@/domains/User';
import { useApi } from '@/hooks/useApi';

import styles from './style.module.less';

const DEFAULT_REWARD_PREVIEW: UserTaskRewardPreview = {
  rewardType: 'TOKEN',
  minRewardAmount: 100_000,
  maxRewardAmount: 1_000_000,
  rewardStepAmount: 100_000,
};

const getRandomRewardAmount = (preview: UserTaskRewardPreview): number => {
  const min = preview.minRewardAmount ?? DEFAULT_REWARD_PREVIEW.minRewardAmount!;
  const max = Math.max(preview.maxRewardAmount ?? min, min);
  const step = preview.rewardStepAmount ?? DEFAULT_REWARD_PREVIEW.rewardStepAmount!;
  const minUnit = Math.ceil(min / step);
  const maxUnit = Math.floor(max / step);
  const unit = minUnit + Math.floor(Math.random() * (maxUnit - minUnit + 1));
  return unit * step;
};

function UserCheckIn() {
  const { t } = useTranslation(['shell', 'common']);
  const userService = useUserService();
  const [isOpen, setIsOpen] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [rewardPreview, setRewardPreview] = useState<UserTaskRewardPreview>(DEFAULT_REWARD_PREVIEW);
  const [displayAmount, setDisplayAmount] = useState(getRandomRewardAmount(DEFAULT_REWARD_PREVIEW));
  const [result, setResult] = useState<UserTaskCheckInResult | null>(null);

  const { loading: loadingStatus } = useApi(
    async () => {
      const task = (await userService.listTaskStatus()).find(
        (item) => item.taskCode === 'DAILY_CHECK_IN'
      );
      return task;
    },
    {
      onSuccess: (task) => {
        setCanCheckIn(Boolean(task?.enabled && task.canComplete));
        if (task?.rewardPreview) {
          setRewardPreview(task.rewardPreview);
          setDisplayAmount(getRandomRewardAmount(task.rewardPreview));
        }
      },
    }
  );

  const { loading: checkingIn, run: runCheckIn } = useApi(async () => userService.dailyCheckIn(), {
    manual: true,
    onSuccess: (nextResult) => {
      setResult(nextResult);
      setCanCheckIn(false);
    },
  });

  useInterval(
    () => {
      setDisplayAmount(getRandomRewardAmount(rewardPreview));
    },
    isOpen && !result && !checkingIn ? 90 : undefined
  );

  const handleOpen = () => {
    setResult(null);
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !checkingIn) {
      setResult(null);
      setIsOpen(false);
    }
  };

  const rewardUnit = rewardPreview.rewardType === 'COIN' ? t('checkIn.coin') : t('checkIn.token');
  const shownAmount = result?.rewardAmount ?? displayAmount;
  const alreadyCheckedIn = !canCheckIn && !result;
  const guaranteeAmount = rewardPreview.maxRewardAmount ?? DEFAULT_REWARD_PREVIEW.maxRewardAmount!;
  const daysUntilGuarantee =
    result == null ? 0 : Math.max(result.cycleCount - result.cycleProgress, 0);

  return (
    <>
      <span className={styles.trigger}>
        <AppIconButton
          icon={<CalendarCheck size={16} aria-hidden="true" />}
          label={t('checkIn.openAria')}
          variant="ghost"
          size="sm"
          isDisabled={loadingStatus}
          tooltip={{ content: t('checkIn.title'), placement: 'top' }}
          onPress={handleOpen}
        />
        {canCheckIn ? <span className={styles.pendingDot} aria-hidden="true" /> : null}
      </span>

      <AppModal
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        title={t('checkIn.title')}
        size="sm"
        isDismissable={!checkingIn}
        actions={
          result || alreadyCheckedIn ? (
            <AppButton variant="primary" onPress={() => handleOpenChange(false)}>
              {t('actions.close', { ns: 'common' })}
            </AppButton>
          ) : (
            <>
              <AppButton
                variant="secondary"
                isDisabled={checkingIn}
                onPress={() => handleOpenChange(false)}
              >
                {t('actions.cancel', { ns: 'common' })}
              </AppButton>
              <AppButton
                variant="primary"
                isDisabled={checkingIn}
                aria-busy={checkingIn || undefined}
                onPress={() => runCheckIn()}
              >
                {checkingIn ? t('checkIn.checkingIn') : t('checkIn.confirm')}
              </AppButton>
            </>
          )
        }
      >
        <div className={styles.modalBody}>
          <p className={styles.description}>
            {result
              ? t('checkIn.success')
              : alreadyCheckedIn
                ? t('checkIn.checkedInToday')
                : t('checkIn.description')}
          </p>
          {alreadyCheckedIn ? null : (
            <div className={styles.reward}>
              <strong className={styles.rewardAmount}>{shownAmount.toLocaleString()}</strong>
              <span className={styles.rewardType}>{rewardUnit}</span>
            </div>
          )}
          {result ? (
            <div className={styles.result}>
              <span>
                {t('checkIn.guaranteeCountdown', {
                  count: daysUntilGuarantee,
                })}
              </span>
              <span>
                {t('checkIn.guaranteeReward', {
                  amount: guaranteeAmount.toLocaleString(),
                  unit: rewardUnit,
                })}
              </span>
            </div>
          ) : null}
        </div>
      </AppModal>
    </>
  );
}

export default UserCheckIn;
