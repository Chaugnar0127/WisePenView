import AppIconButton from '@/components/Button/AppIconButton';
import { AppPopover } from '@/components/Overlay';
import { useChatService } from '@/domains';
import { buildSkillMenuSections } from '@/domains/Chat';
import { parseErrorMessage } from '@/utils/error';
import { ListBox, ListBoxItem, Skeleton, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { Check, Settings, Sparkles, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useChatInputStore, useChatInputStoreApi } from '../_store/ChatInputStore';
import styles from '../style.module.less';

const SKILL_SKELETON_PRIMARY_ROWS = [0, 1] as const;
const SKILL_SKELETON_TOOL_ROWS = [0, 1, 2, 3, 4, 5] as const;

function SkillMenuSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      className={`${styles.popoverPanel} ${styles.popoverPanelScrollable}`}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={styles.popoverSkeletonList}>
        {SKILL_SKELETON_PRIMARY_ROWS.map((row) => (
          <div key={`skill-${row}`} className={styles.popoverSkeletonRow}>
            <Skeleton className={styles.popoverSkeletonIcon} />
            <Skeleton
              className={`${styles.popoverSkeletonLabel} ${row === 1 ? styles.popoverSkeletonLabelWide : ''}`}
            />
          </div>
        ))}
        <Skeleton className={styles.popoverSkeletonSection} />
        {SKILL_SKELETON_TOOL_ROWS.map((row) => (
          <div key={`tool-${row}`} className={styles.popoverSkeletonRow}>
            <Skeleton className={styles.popoverSkeletonIcon} />
            <Skeleton
              className={`${styles.popoverSkeletonLabel} ${row % 2 === 0 ? styles.popoverSkeletonLabelWide : ''}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillMenu() {
  const { t } = useTranslation('chat');
  const chatService = useChatService();
  const store = useChatInputStoreApi();
  const { selectedAgent, selectedSkills, selectedTools, skillMenuOpen } = useChatInputStore(
    useShallow((state) => ({
      selectedAgent: state.selectedAgent,
      selectedSkills: state.selectedSkills,
      selectedTools: state.selectedTools,
      skillMenuOpen: state.skillMenuOpen,
    }))
  );
  const { removeSkill, setOtherSkillModalOpen, setSkillMenuOpen, toggleSkill, toggleTool } =
    store.getState();
  const { data: skillMenuOptions, loading } = useRequest(
    () => chatService.getChatInputCapabilityOptions({ agent: selectedAgent }),
    {
      refreshDeps: [selectedAgent.agentId],
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const showSkeleton = !skillMenuOptions && loading;
  const sections = buildSkillMenuSections({
    primarySkills: skillMenuOptions?.primarySkills ?? [],
    selectedSkills,
    selectedTools,
    toolOptions: skillMenuOptions?.tools ?? [],
    advancedMode: true,
    otherSkillGroups: skillMenuOptions?.otherSkillGroups ?? [],
  });
  const primarySection = sections.find((section) => section.key === 'primary-skills');
  const externalSection = sections.find((section) => section.key === 'external-skills');
  const toolSection = sections.find((section) => section.key === 'tools');
  const selectedSkillIds = selectedSkills.map((skill) => skill.skillId);
  const selectedToolIds = selectedTools.map((tool) => tool.toolId);
  const externalItems =
    externalSection?.items.filter((item) => item.kind === 'external-skill') ?? [];
  const selectedOptionCount = selectedSkills.length + selectedTools.length;
  const skeleton = <SkillMenuSkeleton ariaLabel={t('input.skillMenu.loadingAria')} />;

  function handleToggleSkill(skillId: string): void {
    const skill = skillMenuOptions?.primarySkills.find((item) => item.skillId === skillId);
    if (!skill) return;
    toggleSkill(skill, selectedAgent);
  }

  function handleToggleTool(toolId: string): void {
    const tool = skillMenuOptions?.tools.find((item) => item.toolId === toolId);
    if (!tool) return;
    toggleTool(tool);
  }

  function handleSelectOther(): void {
    setSkillMenuOpen(false);
    setOtherSkillModalOpen(true);
  }

  function getSkillSourceText(skillId: string): string | null {
    const selectedSkill = selectedSkills.find((skill) => skill.skillId === skillId);
    const sourceName = selectedSkill?.groupName || selectedSkill?.sourceAgentLabel;
    if (!sourceName) return null;
    const localizedSourceName =
      selectedSkill.sourceAgentId === 'agent-personal-default'
        ? t('input.agentPicker.defaultAgent')
        : sourceName;
    return t('input.skillMenu.providedBy', { name: localizedSourceName });
  }

  return (
    <AppPopover isOpen={skillMenuOpen} onOpenChange={setSkillMenuOpen}>
      <span className={styles.toolButtonWrap}>
        {selectedOptionCount > 0 ? (
          <span className={styles.skillMenuBadge}>{selectedOptionCount}</span>
        ) : null}
        <AppIconButton
          icon={<Settings size={17} aria-hidden="true" />}
          label={t('input.skillMenu.configure')}
          overlayTrigger={<AppPopover.Trigger />}
        />
      </span>
      <AppPopover.Content placement="top" title={t('input.skillMenu.title')}>
        <AppPopover.DeferredContent fallback={skeleton}>
          {() =>
            showSkeleton ? (
              skeleton
            ) : (
              <div className={`${styles.popoverPanel} ${styles.popoverPanelScrollable}`}>
                {primarySection && primarySection.items.length > 0 ? (
                  <ListBox
                    aria-label={t('input.skillMenu.selectSkill')}
                    selectionMode="multiple"
                    selectedKeys={selectedSkillIds}
                    className={styles.listBox}
                  >
                    {primarySection.items.map((item) => (
                      <ListBoxItem
                        key={item.key}
                        id={item.key}
                        textValue={item.label}
                        onPress={() => handleToggleSkill(item.key)}
                      >
                        <span className={styles.listItemContent}>
                          <Sparkles size={16} />
                          <span>{item.label}</span>
                          {selectedSkillIds.includes(item.key) ? (
                            <Check size={14} className={styles.checkIcon} />
                          ) : null}
                        </span>
                      </ListBoxItem>
                    ))}
                  </ListBox>
                ) : null}

                {externalItems.length > 0 ? (
                  <>
                    <div className={styles.popoverTitle}>{t('input.skillMenu.otherTitle')}</div>
                    <ListBox
                      aria-label={t('input.skillMenu.selectedOtherAria')}
                      selectionMode="multiple"
                      selectedKeys={externalItems.map((item) => item.key)}
                      className={styles.listBox}
                    >
                      {externalItems.map((item) => (
                        <ListBoxItem
                          key={item.key}
                          id={item.key}
                          textValue={item.label}
                          onPress={() => removeSkill(item.key)}
                        >
                          <span className={styles.listItemContent}>
                            <Sparkles size={16} />
                            <span>
                              {item.label}
                              {getSkillSourceText(item.key) ? (
                                <span className={styles.skillMenuSourceText}>
                                  {getSkillSourceText(item.key)}
                                </span>
                              ) : null}
                            </span>
                            <Check size={14} className={styles.checkIcon} />
                          </span>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </>
                ) : null}

                <ListBox
                  aria-label={t('input.skillMenu.selectOther')}
                  selectionMode="none"
                  className={styles.listBox}
                  onAction={handleSelectOther}
                >
                  <ListBoxItem id="select-other-skill" textValue={t('input.skillMenu.selectOther')}>
                    <span className={styles.listItemContent}>
                      <Sparkles size={16} />
                      <span>{t('input.skillMenu.selectOther')}</span>
                    </span>
                  </ListBoxItem>
                </ListBox>

                {toolSection && toolSection.items.length > 0 ? (
                  <>
                    <div className={styles.popoverTitle}>{t('input.skillMenu.toolsTitle')}</div>
                    <ListBox
                      aria-label={t('input.skillMenu.selectTools')}
                      selectionMode="multiple"
                      selectedKeys={selectedToolIds}
                      className={styles.listBox}
                    >
                      {toolSection.items.map((item) => (
                        <ListBoxItem
                          key={item.key}
                          id={item.key}
                          textValue={item.label}
                          onPress={() => handleToggleTool(item.key)}
                        >
                          <span className={styles.listItemContent}>
                            <Wrench size={16} />
                            <span>{item.label}</span>
                            {selectedToolIds.includes(item.key) ? (
                              <Check size={14} className={styles.checkIcon} />
                            ) : null}
                          </span>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </>
                ) : null}
              </div>
            )
          }
        </AppPopover.DeferredContent>
      </AppPopover.Content>
    </AppPopover>
  );
}

export default SkillMenu;
