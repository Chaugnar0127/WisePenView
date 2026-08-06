import { useGroupContext } from '@/layouts/Group/GroupContext';
import { useOutletContext } from 'react-router-dom';
import type { GroupDetailOutletContextValue } from '..';
import OwnerGroupTokenTransfer from '../../_components/OwnerGroupTokenTransfer';
import layout from '../../style.module.less';

function GroupTokenTransferPage() {
  const { group } = useGroupContext();
  const { refreshWallet } = useOutletContext<GroupDetailOutletContextValue>();
  return (
    <div className={layout.tabPane}>
      <OwnerGroupTokenTransfer groupId={group.groupId} onTransferSuccess={refreshWallet} />
    </div>
  );
}

export default GroupTokenTransferPage;
