import { RESOURCE_KIND, RESOURCE_VIEWER } from '@/domains/Resource/model/resourceTarget';

import type { EditorKind, EditorTarget } from './editor.type';

/** 根据资源类型与查看器解析编辑器，保持路由层与懒加载注册表使用同一规则。 */
export function resolveEditorKind(target: EditorTarget): EditorKind | undefined {
  if (target.resourceType === RESOURCE_KIND.FILE) {
    if (target.viewer === RESOURCE_VIEWER.PDF_PREVIEW) return 'pdf';
    if (target.viewer === RESOURCE_VIEWER.OFFICE) return 'office';
    return undefined;
  }
  if (target.resourceType === target.viewer) return target.resourceType;
  return undefined;
}
