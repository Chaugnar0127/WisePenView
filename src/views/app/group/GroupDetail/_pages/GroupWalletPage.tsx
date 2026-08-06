import { WALLET_TARGET_TYPE } from '@/domains/Wallet';
import { useGroupContext } from '@/layouts/Group/GroupContext';
import ComputeWallet from '@/views/app/_common/Wallet/ComputeWallet';
import { useOutletContext } from 'react-router-dom';
import type { GroupDetailOutletContextValue } from '..';
import layout from '../../style.module.less';

function GroupWalletPage() {
  const { group } = useGroupContext();
  const { walletRefreshVersion } = useOutletContext<GroupDetailOutletContextValue>();
  return (
    <div className={layout.tabPane}>
      <ComputeWallet
        targetType={WALLET_TARGET_TYPE.GROUP}
        targetId={group.groupId}
        canRecharge={false}
        showOperatorColumn
        refreshVersion={walletRefreshVersion}
      />
    </div>
  );
}

export default GroupWalletPage;
