import type { ResourceIconType } from '../entity/resource';

const RESOURCE_TYPE_ICON_TYPE_MAP: Record<string, ResourceIconType> = {
  note: 'note',
  drawio: 'drawio',
  skill: 'skill',
  agent: 'agent',
  pdf: 'pdf',
  doc: 'doc',
  docx: 'doc',
  ppt: 'ppt',
  pptx: 'ppt',
  xls: 'xls',
  xlsx: 'xls',
  md: 'md',
  markdown: 'md',
  image: 'image',
  img: 'image',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  video: 'video',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  file: 'file',
  document: 'file',
};

export const resolveResourceIconType = (resourceType?: string): ResourceIconType => {
  const rawType = resourceType?.trim().toLowerCase();
  const typeIcon = rawType ? RESOURCE_TYPE_ICON_TYPE_MAP[rawType] : undefined;
  return typeIcon ?? 'file';
};
