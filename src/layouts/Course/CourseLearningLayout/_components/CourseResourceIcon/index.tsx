import EntryIcon from '@/components/Icons/EntryIcon';
import type { CourseOutlineNode } from '@/domains/Course';
import { Folder, Video } from 'lucide-react';

interface CourseResourceIconProps {
  node: CourseOutlineNode;
  size: number;
}

function CourseResourceIcon({ node, size }: CourseResourceIconProps) {
  if (node.nodeType !== 'RESOURCE') {
    return <Folder size={size} color="var(--warning)" aria-hidden />;
  }
  if (node.viewer === 'video') {
    return <Video size={size} color="var(--warning)" aria-hidden />;
  }
  return (
    <EntryIcon
      entryType="resource"
      resourceType={node.resourceType}
      resourceIconType={node.viewer === 'pdf-preview' ? 'pdf' : undefined}
      size={size}
    />
  );
}

export default CourseResourceIcon;
