import type { CourseOutlineNode } from '@/domains/Course';
import { FileText, Folder, NotebookPen, Video } from 'lucide-react';

interface CourseResourceIconProps {
  node: CourseOutlineNode;
  size: number;
}

function CourseResourceIcon({ node, size }: CourseResourceIconProps) {
  if (node.nodeType !== 'RESOURCE') return <Folder size={size} aria-hidden />;
  if (node.viewer === 'video') return <Video size={size} aria-hidden />;
  if (node.resourceType === 'note') return <NotebookPen size={size} aria-hidden />;
  return <FileText size={size} aria-hidden />;
}

export default CourseResourceIcon;
