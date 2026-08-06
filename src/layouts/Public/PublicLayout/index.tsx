import { Outlet } from 'react-router-dom';
import styles from './style.module.less';

function PublicLayout() {
  return (
    <div className={styles.pageContainer}>
      <Outlet />
    </div>
  );
}

export default PublicLayout;
