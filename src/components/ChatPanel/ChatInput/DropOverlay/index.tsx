import styles from '../style.module.less';
import type { DropOverlayProps } from './index.type';

function DropOverlay({ visible }: DropOverlayProps) {
  return (
    <div
      className={styles.dropOverlay}
      data-visible={visible ? 'true' : 'false'}
      aria-hidden={!visible}
    >
      <span className={styles.dropOverlayLabel}>松开即可添加附件</span>
    </div>
  );
}

export default DropOverlay;
