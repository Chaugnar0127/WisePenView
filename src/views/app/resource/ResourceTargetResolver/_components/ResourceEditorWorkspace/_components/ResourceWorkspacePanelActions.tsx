import { Bot, MessageSquareText, MessagesSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppIconButton from '@/components/base/Button/AppIconButton';
import { GuideAnchor } from '@/components/base/Guide';
import { GUIDE_TOOL_ID } from '@/constants/tour';
import {
  getWorkspacePanelTargetId,
  useWorkspaceRightPanel,
  type WorkspacePanelId,
} from '@/layouts/WorkspaceRightPanelLayout';

interface ResourceWorkspacePanelActionsProps {
  inlineCommentAvailable: boolean;
  interactAvailable: boolean;
}

function ResourceWorkspacePanelActions({
  inlineCommentAvailable,
  interactAvailable,
}: ResourceWorkspacePanelActionsProps) {
  const { t } = useTranslation('resource');
  const { activePanelId, togglePanel } = useWorkspaceRightPanel();
  const triggerRefs = useRef<Partial<Record<WorkspacePanelId, HTMLButtonElement | null>>>({});
  const previousActivePanelRef = useRef(activePanelId);

  const chatLabel =
    activePanelId === 'chat' ? t('sidePanel.collapseChat') : t('sidePanel.expandChat');
  const inlineCommentLabel =
    activePanelId === 'inlineComment'
      ? t('sidePanel.collapseAnnotation')
      : t('sidePanel.expandAnnotation');
  const interactLabel =
    activePanelId === 'interact'
      ? t('sidePanel.collapseInteraction')
      : t('sidePanel.expandInteraction');
  const unavailableInlineCommentLabel = t('sidePanel.inlineCommentUnavailable');
  const unavailableInteractLabel = t('sidePanel.interactUnavailable');

  /**
   * @wisepen-manual-effect
   * 执行时机：右栏从某个面板关闭时。
   * 不可替代原因：关闭按钮已位于即将隐藏的 portal 中，必须把焦点送回对应的顶栏触发按钮。
   * cleanup：取消尚未执行的动画帧，避免卸载后移动焦点。
   */
  useEffect(() => {
    const previousActivePanelId = previousActivePanelRef.current;
    previousActivePanelRef.current = activePanelId;
    if (!previousActivePanelId || activePanelId) return;

    const frame = window.requestAnimationFrame(() => {
      const trigger = triggerRefs.current[previousActivePanelId];
      const nextFocus = trigger && !trigger.disabled ? trigger : triggerRefs.current.chat;
      nextFocus?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePanelId]);

  return (
    <>
      <GuideAnchor id={GUIDE_TOOL_ID.noteChat}>
        <AppIconButton
          ref={(node) => {
            triggerRefs.current.chat = node;
          }}
          icon={<Bot size={18} aria-hidden="true" />}
          label={chatLabel}
          size="sm"
          isActive={activePanelId === 'chat'}
          aria-controls={getWorkspacePanelTargetId('chat')}
          aria-expanded={activePanelId === 'chat'}
          tooltip={{ content: chatLabel }}
          onPress={() => togglePanel('chat')}
        />
      </GuideAnchor>
      <AppIconButton
        ref={(node) => {
          triggerRefs.current.inlineComment = node;
        }}
        icon={<MessageSquareText size={18} aria-hidden="true" />}
        label={inlineCommentAvailable ? inlineCommentLabel : unavailableInlineCommentLabel}
        size="sm"
        isActive={activePanelId === 'inlineComment'}
        isDisabled={!inlineCommentAvailable}
        aria-controls={getWorkspacePanelTargetId('inlineComment')}
        aria-expanded={activePanelId === 'inlineComment'}
        tooltip={{
          content: inlineCommentAvailable ? inlineCommentLabel : unavailableInlineCommentLabel,
        }}
        onPress={() => togglePanel('inlineComment')}
      />
      <AppIconButton
        ref={(node) => {
          triggerRefs.current.interact = node;
        }}
        icon={<MessagesSquare size={18} aria-hidden="true" />}
        label={interactAvailable ? interactLabel : unavailableInteractLabel}
        size="sm"
        isActive={activePanelId === 'interact'}
        isDisabled={!interactAvailable}
        aria-controls={getWorkspacePanelTargetId('interact')}
        aria-expanded={activePanelId === 'interact'}
        tooltip={{ content: interactAvailable ? interactLabel : unavailableInteractLabel }}
        onPress={() => togglePanel('interact')}
      />
    </>
  );
}

export default ResourceWorkspacePanelActions;
