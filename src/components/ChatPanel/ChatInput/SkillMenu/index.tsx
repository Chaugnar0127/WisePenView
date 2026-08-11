import { AppButton } from '@/components/Button';
import AppIconButton from '@/components/Button/AppIconButton';
import { AppPopover } from '@/components/Overlay';
import { useChatService } from '@/domains';
import { buildSkillMenuSections } from '@/domains/Chat';
import { useApi } from '@/hooks/useApi';
import { Header, ListBox, ListBoxSection, Skeleton } from '@heroui/react';

import { Settings, Sparkles, Wrench } from 'lucide-react';
import type { Key } from 'react';
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
  const { data: skillMenuOptions, loading } = useApi(
    () => chatService.getChatInputCapabilityOptions({ agent: selectedAgent }),
    {
      ready: skillMenuOpen,
      refreshDeps: [selectedAgent.agentId],
    }
  );
  const showSkeleton = !skillMenuOptions && loading;
  const sections = buildSkillMenuSections({
    primarySkills: skillMenuOptions?.primarySkills ?? [],
    selectedSkills,
    selectedTools,
    toolOptions: skillMenuOptions?.tools ?? [],
    advancedMode: true,
    otherSkillGroups: [],
  });
  const primarySection = sections.find((section) => section.key === 'primary-skills');
  const externalSection = sections.find((section) => section.key === 'external-skills');
  const toolSection = sections.find((section) => section.key === 'tools');
  const selectedSkillIds = selectedSkills.map((skill) => skill.skillId);
  const selectedToolIds = selectedTools.map((tool) => tool.toolId);
  const externalItems =
    externalSection?.items.filter((item) => item.kind === 'external-skill') ?? [];
  const selectedOptionCount = selectedSkills.length + selectedTools.length;
  const selectedMenuKeys = new Set([...selectedSkillIds, ...selectedToolIds]);
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

  function handleMenuAction(key: Key): void {
    if (primarySection?.items.some((item) => item.key === key)) {
      handleToggleSkill(String(key));
      return;
    }
    if (externalItems.some((item) => item.key === key)) {
      removeSkill(String(key));
      return;
    }
    if (toolSection?.items.some((item) => item.key === key)) {
      handleToggleTool(String(key));
    }
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
      <AppPopover.Content
        placement="top"
        title={t('input.skillMenu.title')}
        bodyPadding="none"
        classNames={{ header: styles.compactPopoverHeader }}
      >
        {showSkeleton ? (
          skeleton
        ) : (
          <div className={styles.popoverPanelScrollable}>
            <ListBox
              aria-label={t('input.skillMenu.configure')}
              selectionMode="multiple"
              selectedKeys={selectedMenuKeys}
              className={styles.listBox}
              onAction={handleMenuAction}
            >
              {primarySection && primarySection.items.length > 0 ? (
                <ListBoxSection id="primary-skills">
                  {primarySection.items.map((item) => (
                    <ListBox.Item
                      key={item.key}
                      id={item.key}
                      textValue={item.label}
                      className={styles.listBoxItem}
                    >
                      <span className={styles.listItemContent}>
                        <span className={styles.listItemLeading}>
                          <Sparkles size={16} aria-hidden="true" />
                        </span>
                        <span className={styles.listItemText}>
                          <span className={styles.listItemLabel}>{item.label}</span>
                        </span>
                        <ListBox.ItemIndicator />
                      </span>
                    </ListBox.Item>
                  ))}
                </ListBoxSection>
              ) : null}

              {externalItems.length > 0 ? (
                <ListBoxSection id="external-skills" className={styles.listBoxSection}>
                  <Header className={styles.listBoxSectionTitle}>
                    {t('input.skillMenu.otherTitle')}
                  </Header>
                  {externalItems.map((item) => (
                    <ListBox.Item
                      key={item.key}
                      id={item.key}
                      textValue={item.label}
                      className={styles.listBoxItem}
                    >
                      <span className={styles.listItemContent}>
                        <span className={styles.listItemLeading}>
                          <Sparkles size={16} aria-hidden="true" />
                        </span>
                        <span className={styles.listItemText}>
                          <span className={styles.listItemLabel}>{item.label}</span>
                          {getSkillSourceText(item.key) ? (
                            <span className={styles.listItemDescription}>
                              {getSkillSourceText(item.key)}
                            </span>
                          ) : null}
                        </span>
                        <ListBox.ItemIndicator />
                      </span>
                    </ListBox.Item>
                  ))}
                </ListBoxSection>
              ) : null}

              {toolSection && toolSection.items.length > 0 ? (
                <ListBoxSection id="tools" className={styles.listBoxSection}>
                  <Header className={styles.listBoxSectionTitle}>
                    {t('input.skillMenu.toolsTitle')}
                  </Header>
                  {toolSection.items.map((item) => (
                    <ListBox.Item
                      key={item.key}
                      id={item.key}
                      textValue={item.label}
                      className={styles.listBoxItem}
                    >
                      <span className={styles.listItemContent}>
                        <span className={styles.listItemLeading}>
                          <Wrench size={16} aria-hidden="true" />
                        </span>
                        <span className={styles.listItemText}>
                          <span className={styles.listItemLabel}>{item.label}</span>
                        </span>
                        <ListBox.ItemIndicator />
                      </span>
                    </ListBox.Item>
                  ))}
                </ListBoxSection>
              ) : null}
            </ListBox>

            <AppButton
              size="sm"
              variant="ghost"
              className={styles.agentGroupAction}
              onPress={handleSelectOther}
            >
              <span className={styles.agentGroupTitle}>
                <Sparkles size={14} aria-hidden="true" />
                <span>{t('input.skillMenu.selectOther')}</span>
              </span>
            </AppButton>
          </div>
        )}
      </AppPopover.Content>
    </AppPopover>
  );
}

export default SkillMenu;
