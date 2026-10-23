import { lazy } from 'react';

export const editorRegistry = {
  note: lazy(() => import('./note')),
  pdf: lazy(() => import('./pdf')),
  skill: lazy(() => import('./skill')),
  agent: lazy(() => import('./agent')),
  drawio: lazy(() => import('./drawio')),
  office: lazy(() => import('./office')),
  html: lazy(() => import('./html')),
} as const;

export { resolveEditorKind } from './editorKind';
