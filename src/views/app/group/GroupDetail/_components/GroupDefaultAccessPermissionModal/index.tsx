import ResourcePermissionActionIcon from '@/components/Drive/common/resourcePermissionActionIcon';
import {
  TAG_PERMISSION_ACTION_PRESET_OPTIONS,
  TAG_PERMISSION_ACTION_ROWS,
  TAG_PERMISSION_RESOURCE_STRATEGIES,
} from '@/components/Drive/common/tagPermissionPreset';
import styles from '@/components/Drive/Modals/TagPermissionModal/style.module.less';
import AppModal from '@/components/Overlay/AppModal';
import { useGroupService } from '@/domains';
import type { GroupResConfig } from '@/domains/Group';
import {
  buildTagPermissionListActionSelectionPatch,
  isTagPermissionListActionSelected,
  normalizeResourceActions,
  type TagPermissionListAction,
  type TagPermissionPresetKey,
  type TagResourceAction,
} from '@/domains/Tag';
import { parseErrorMessage } from '@/utils/error';
import { Button, Checkbox, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GroupPolicyShellCard from '../GroupPolicyShellCard';

const PRESET_LABEL_KEYS = {
  private: 'permission.preset.private',
  readonly: 'permission.preset.readonly',
  shared: 'permission.preset.shared',
} as const;

const STRATEGY_LABEL_KEYS = {
  note: 'permission.strategy.note',
  file: 'permission.strategy.file',
  drawio: 'permission.strategy.drawio',
  aiAsset: 'permission.strategy.aiAsset',
} as const;

const ACTION_LABEL_KEYS = {
  DISCOVER: 'permission.action.DISCOVER',
  VIEW: 'permission.action.VIEW',
  LOAD: 'permission.action.LOAD',
  EDIT: 'permission.action.EDIT',
  INLINE_COMMENT: 'permission.action.INLINE_COMMENT',
  DOWNLOAD_WATERMARK: 'permission.action.DOWNLOAD_WATERMARK',
  DOWNLOAD_ORIGINAL: 'permission.action.DOWNLOAD_ORIGINAL',
  FORK: 'permission.action.FORK',
  COMMENT: 'permission.action.COMMENT',
} as const;

interface GroupDefaultAccessPermissionModalProps {
  isOpen: boolean;
  groupId: string;
  groupResConfig: GroupResConfig;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function isSameActionSet(
  left: TagResourceAction[] | undefined,
  right: TagResourceAction[] | undefined
): boolean {
  const leftSet = new Set(normalizeResourceActions(left));
  const rightSet = new Set(normalizeResourceActions(right));
  if (leftSet.size !== rightSet.size) return false;
  return [...leftSet].every((action) => rightSet.has(action));
}

function resolveActionPresetKey(
  actions: TagResourceAction[]
): Exclude<TagPermissionPresetKey, 'custom'> | 'custom' {
  const matchedPreset = TAG_PERMISSION_ACTION_PRESET_OPTIONS.find((preset) =>
    isSameActionSet(preset.values.grantedActions, actions)
  );
  return matchedPreset?.key ?? 'custom';
}

function GroupDefaultAccessPermissionModal({
  isOpen,
  groupId,
  groupResConfig,
  onOpenChange,
  onSuccess,
}: GroupDefaultAccessPermissionModalProps) {
  const { t } = useTranslation(['group', 'common']);
  const groupService = useGroupService();
  const [selectedActions, setSelectedActions] = useState<TagResourceAction[]>(() =>
    normalizeResourceActions(groupResConfig.defaultMemberActions)
  );
  const selectedPresetKey = resolveActionPresetKey(selectedActions);

  const { loading: saving, run: runSave } = useRequest(
    async (actions: TagResourceAction[]) => {
      await groupService.updateGroupResConfig({
        groupId,
        defaultMemberActions: normalizeResourceActions(actions),
      });
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success(t('permission.saved'));
        onOpenChange(false);
        onSuccess();
      },
      onError: (error: unknown) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && saving) return;
    onOpenChange(nextOpen);
  };

  const handlePresetChange = (presetKey: Exclude<TagPermissionPresetKey, 'custom'>) => {
    const preset = TAG_PERMISSION_ACTION_PRESET_OPTIONS.find((item) => item.key === presetKey);
    if (!preset) return;
    setSelectedActions(normalizeResourceActions(preset.values.grantedActions));
  };

  const handleActionToggle = (action: TagPermissionListAction, checked: boolean) => {
    if (saving) return;
    setSelectedActions((current) => {
      const patch = buildTagPermissionListActionSelectionPatch(
        { grantedActions: current },
        action,
        checked
      );
      return normalizeResourceActions(patch.grantedActions);
    });
  };

  const selectedPresetLabel =
    selectedPresetKey === 'custom'
      ? t('permission.custom')
      : t(PRESET_LABEL_KEYS[selectedPresetKey]);

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t('permission.accessTitle')}
      size="lg"
      containerClassName={styles.modalContainer}
      dialogClassName={styles.modalDialog}
      isDismissable={!saving}
      actions={
        <>
          <Button variant="secondary" isDisabled={saving} onPress={() => handleOpenChange(false)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button variant="primary" isPending={saving} onPress={() => runSave(selectedActions)}>
            {t('actions.save', { ns: 'common' })}
          </Button>
        </>
      }
    >
      <div className={styles.modalFormPadding}>
        <div className={styles.advancedAccessGrid}>
          <GroupPolicyShellCard title={t('permission.accessList')} />
          <section
            className={styles.permissionCard}
            aria-label={t('permission.resourceActionsAria')}
          >
            <div className={styles.presetBar}>
              <span className={styles.presetLabel}>{t('permission.basedOnPreset')}</span>
              <div
                className={styles.presetButtons}
                role="group"
                aria-label={t('permission.basedOnPreset')}
              >
                {TAG_PERMISSION_ACTION_PRESET_OPTIONS.map((preset) => (
                  <Button
                    key={preset.key}
                    variant={selectedPresetKey === preset.key ? 'primary' : 'secondary'}
                    size="sm"
                    isDisabled={saving}
                    onPress={() => handlePresetChange(preset.key)}
                  >
                    {t(PRESET_LABEL_KEYS[preset.key])}
                  </Button>
                ))}
              </div>
              <span className={styles.currentPreset}>
                {t('permission.currentPreset', { preset: selectedPresetLabel })}
              </span>
            </div>

            <div className={styles.permissionTableShell}>
              <table className={styles.permissionTable}>
                <thead>
                  <tr>
                    <th className={styles.actionHeader}>{t('permission.actionHeader')}</th>
                    <th className={styles.toggleHeader}>{t('permission.enabledHeader')}</th>
                    {TAG_PERMISSION_RESOURCE_STRATEGIES.map((strategy) => {
                      const strategyLabel = t(STRATEGY_LABEL_KEYS[strategy.key]);
                      return (
                        <th key={strategy.key} className={styles.resourceApplicabilityHeader}>
                          {t('permission.strategyApplicable', { strategy: strategyLabel })}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {TAG_PERMISSION_ACTION_ROWS.map((row) => {
                    const actionLabel = t(ACTION_LABEL_KEYS[row.action.key]);
                    const selected = isTagPermissionListActionSelected(
                      { grantedActions: selectedActions },
                      row.action
                    );
                    return (
                      <tr key={row.key}>
                        <th className={styles.actionCell}>
                          <span className={styles.actionName}>
                            <ResourcePermissionActionIcon
                              action={row.action.action}
                              className={styles.actionIcon}
                            />
                            <span className={styles.actionText}>{actionLabel}</span>
                          </span>
                        </th>
                        <td
                          className={styles.permissionToggleCell}
                          onClick={() => handleActionToggle(row.action, !selected)}
                        >
                          <Checkbox
                            className={styles.permissionCheckbox}
                            aria-label={actionLabel}
                            isDisabled={saving}
                            isSelected={selected}
                            onChange={(isSelected) => handleActionToggle(row.action, isSelected)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        {TAG_PERMISSION_RESOURCE_STRATEGIES.map((strategy) => {
                          const strategyLabel = t(STRATEGY_LABEL_KEYS[strategy.key]);
                          const supported = row.supportedStrategyKeys.includes(strategy.key);
                          const cellClassName = !supported
                            ? styles.unsupportedCell
                            : selected
                              ? styles.supportedCell
                              : styles.deniedCell;
                          return (
                            <td key={strategy.key} className={cellClassName}>
                              {!supported ? (
                                <span aria-hidden="true">-</span>
                              ) : selected ? (
                                <Check
                                  size={14}
                                  aria-label={t('permission.actionEnabled', {
                                    strategy: strategyLabel,
                                    action: actionLabel,
                                  })}
                                  className={styles.permissionStateIcon}
                                />
                              ) : (
                                <X
                                  size={14}
                                  aria-label={t('permission.actionDisabled', {
                                    strategy: strategyLabel,
                                    action: actionLabel,
                                  })}
                                  className={styles.permissionStateIcon}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppModal>
  );
}

export default GroupDefaultAccessPermissionModal;
