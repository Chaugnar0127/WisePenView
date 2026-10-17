import { isRecord } from '@/utils/type/typeGuards';

import type { NoteInlineAiDiff } from '../../registry/types';
import styles from './InlineChecklist/style.module.less';
import {
  readChecked,
  readChecklistBackgroundColor,
  readChecklistBorderColor,
  readGroupId,
  readInlineChecklistMode,
  readLabel,
} from './model';

function readProps(value: Record<string, unknown>): Record<string, unknown> {
  return isRecord(value.props) ? value.props : value;
}

export const inlineChecklistAiDiff: NoteInlineAiDiff = {
  renderAiContent(aiContent) {
    const props = readProps(aiContent);
    const root = document.createElement('span');
    root.className = `${styles.root} bn-inline-checklist-root`;
    root.contentEditable = 'false';
    root.dataset.inlineChecklist = '';
    const checked = readChecked(props.checked);
    const mode = readInlineChecklistMode(props.mode);
    const groupId = readGroupId(props.groupId);
    const borderColor = readChecklistBorderColor(props);
    const backgroundColor = readChecklistBackgroundColor(props);
    root.dataset.checked = checked ? 'true' : 'false';
    root.dataset.mode = mode;
    root.dataset.checklistBorderColor = borderColor;
    root.dataset.checklistBackgroundColor = backgroundColor;
    if (groupId) {
      root.dataset.groupId = groupId;
    }

    const control = document.createElement('span');
    control.className = styles.control;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = styles.input;
    input.checked = checked;
    input.disabled = true;
    control.appendChild(input);

    const label = document.createElement('span');
    label.className = `${styles.label} bn-inline-checklist-label`;
    const labelText = readLabel(props.label);
    label.textContent = labelText;
    if (labelText.length === 0) {
      label.dataset.empty = 'true';
    }

    root.appendChild(control);
    root.appendChild(label);
    return root;
  },
};
