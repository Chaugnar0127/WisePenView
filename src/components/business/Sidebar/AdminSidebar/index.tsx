import UserProfile from '../_common/footer/UserProfile';
import SidebarHeader from '../_common/header/SidebarHeader';
import shellStyles from '../_common/sidebarShell.module.less';
import AdminHeaderNav from './AdminHeaderNav';
import styles from './style.module.less';

interface AdminSidebarProps {
  onToggle: () => void;
}

function AdminSidebar({ onToggle }: AdminSidebarProps) {
  return (
    <div className={shellStyles.sider}>
      <SidebarHeader collapsed={false} onToggle={onToggle} title="WisePen Admin" />
      <div className={styles.navBody}>
        <AdminHeaderNav collapsed={false} />
      </div>
      <UserProfile collapsed={false} menuMode="admin" />
    </div>
  );
}

export default AdminSidebar;
