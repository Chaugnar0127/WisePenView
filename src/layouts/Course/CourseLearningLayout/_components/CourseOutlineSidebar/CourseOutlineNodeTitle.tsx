import AppIconButton from '@/components/Button/AppIconButton';
import { AppPopover } from '@/components/Overlay';
import type { CourseOutlineNode } from '@/domains/Course';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  BookOpenText,
  BookText,
  CloudUpload,
  Ellipsis,
  FolderInput,
  FolderPlus,
  NotebookText,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../../style.module.less';
import CourseResourceIcon from '../CourseResourceIcon';
import type { CourseOutlineContainerNode, CourseOutlineResourceTarget } from './model';

interface CourseOutlineNodeTitleProps {
  node: CourseOutlineNode;
  parentId?: string;
  editable: boolean;
  readIndicator?: ReactNode;
  canMoveContainer: (node: CourseOutlineContainerNode, offset: -1 | 1) => boolean;
  onCreateChild: (node: CourseOutlineContainerNode) => void;
  onMountFromDrive: (node: CourseOutlineContainerNode) => void;
  onUploadLocal: (node: CourseOutlineContainerNode) => void;
  onRename: (node: CourseOutlineContainerNode) => void;
  onMoveContainer: (node: CourseOutlineContainerNode, offset: -1 | 1) => void;
  onDelete: (node: CourseOutlineContainerNode) => void;
  onMoveResource: (target: CourseOutlineResourceTarget) => void;
  onRemoveResource: (target: CourseOutlineResourceTarget) => void;
}

function stopTreeAction(event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
  event.stopPropagation();
}

function CourseOutlineNodeTitle({
  node,
  parentId,
  editable,
  readIndicator,
  canMoveContainer,
  onCreateChild,
  onMountFromDrive,
  onUploadLocal,
  onRename,
  onMoveContainer,
  onDelete,
  onMoveResource,
  onRemoveResource,
}: CourseOutlineNodeTitleProps) {
  const { t } = useTranslation('course');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const isResource = node.nodeType === 'RESOURCE';

  const closeAndRun = (action: () => void) => {
    setCreateMenuOpen(false);
    setMoreMenuOpen(false);
    action();
  };

  return (
    <span
      className={styles.outlineNodeTitle}
      data-editable={editable || undefined}
      data-resource={isResource || undefined}
    >
      <span className={styles.outlineNodeMain}>
        {isResource ? (
          <CourseResourceIcon node={node} size={15} />
        ) : node.nodeType === 'CHAPTER' ? (
          <span className={styles.outlineContainerIcon} aria-hidden>
            <BookText size={15} className={styles.outlineCollapsedIcon} />
            <BookOpen size={15} className={styles.outlineExpandedIcon} />
          </span>
        ) : (
          <span className={styles.outlineContainerIcon} aria-hidden>
            <NotebookText size={15} className={styles.outlineCollapsedIcon} />
            <BookOpenText size={15} className={styles.outlineExpandedIcon} />
          </span>
        )}
        <span className={styles.outlineNodeLabel} title={node.title}>
          {node.title}
        </span>
        {!editable ? readIndicator : null}
      </span>

      {editable ? (
        <span
          className={styles.outlineNodeActions}
          onClick={stopTreeAction}
          onKeyDown={stopTreeAction}
        >
          {!isResource ? (
            <>
              <AppPopover isOpen={createMenuOpen} onOpenChange={setCreateMenuOpen}>
                <AppIconButton
                  icon={<Plus size={14} aria-hidden />}
                  label={t('editor.outline.createIn', { name: node.title })}
                  size="sm"
                  className={styles.outlineNodeActionButton}
                  tooltip={{ content: t('editor.outline.addContent') }}
                  overlayTrigger={<AppPopover.Trigger />}
                />
                <AppPopover.Content placement="right">
                  <div className={styles.outlineActionMenu}>
                    <button type="button" onClick={() => closeAndRun(() => onCreateChild(node))}>
                      <FolderPlus size={15} aria-hidden />
                      {t('editor.outline.createSection')}
                    </button>
                    <button type="button" onClick={() => closeAndRun(() => onMountFromDrive(node))}>
                      <CloudUpload size={15} aria-hidden />
                      {t('editor.outline.uploadDrive')}
                    </button>
                    <button type="button" onClick={() => closeAndRun(() => onUploadLocal(node))}>
                      <Upload size={15} aria-hidden />
                      {t('editor.outline.uploadLocal')}
                    </button>
                  </div>
                </AppPopover.Content>
              </AppPopover>
              <AppIconButton
                icon={<Pencil size={14} aria-hidden />}
                label={t('editor.outline.renameNode', { name: node.title })}
                size="sm"
                className={styles.outlineNodeActionButton}
                tooltip={{ content: t('editor.actions.rename') }}
                onClick={() => onRename(node)}
              />
            </>
          ) : null}

          <AppPopover isOpen={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <AppIconButton
              icon={<Ellipsis size={14} aria-hidden />}
              label={t('editor.outline.moreActions', { name: node.title })}
              size="sm"
              className={styles.outlineNodeActionButton}
              tooltip={{ content: t('editor.outline.moreActionsLabel') }}
              overlayTrigger={<AppPopover.Trigger />}
            />
            <AppPopover.Content placement="right">
              <div className={styles.outlineActionMenu}>
                {isResource && parentId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndRun(() => onMoveResource({ node, parentId }))}
                    >
                      <FolderInput size={15} aria-hidden />
                      {t('editor.outline.moveResource')}
                    </button>
                    <button
                      type="button"
                      className={styles.dangerAction}
                      onClick={() => closeAndRun(() => onRemoveResource({ node, parentId }))}
                    >
                      <Trash2 size={15} aria-hidden />
                      {t('editor.outline.removeResource')}
                    </button>
                  </>
                ) : null}
                {!isResource ? (
                  <>
                    {canMoveContainer(node, -1) ? (
                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onMoveContainer(node, -1))}
                      >
                        <ArrowUp size={15} aria-hidden />
                        {t('editor.actions.moveUp')}
                      </button>
                    ) : null}
                    {canMoveContainer(node, 1) ? (
                      <button
                        type="button"
                        onClick={() => closeAndRun(() => onMoveContainer(node, 1))}
                      >
                        <ArrowDown size={15} aria-hidden />
                        {t('editor.actions.moveDown')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.dangerAction}
                      onClick={() => closeAndRun(() => onDelete(node))}
                    >
                      <Trash2 size={15} aria-hidden />
                      {t('editor.actions.delete')}
                    </button>
                  </>
                ) : null}
              </div>
            </AppPopover.Content>
          </AppPopover>
        </span>
      ) : null}
    </span>
  );
}

export default CourseOutlineNodeTitle;
