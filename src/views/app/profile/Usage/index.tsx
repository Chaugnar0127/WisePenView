/**
 * 个人中心「余额与使用量」（左下角入口）：展示个人钱包和各小组配额。
 * 与外观页一致，使用表面卡片包裹内容区。
 */
import { WALLET_TARGET_TYPE } from '@/domains/Wallet';
import ComputeWallet from '@/views/app/_common/Wallet/ComputeWallet';
import { Card, Heading, Paragraph } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import QuotaByGroup from '../_components/QuotaByGroup';
import layout from '../style.module.less';

function Usage() {
  const { t } = useTranslation('profile');

  return (
    <div className={layout.pageContainer}>
      <header className={layout.pageHeader}>
        <Heading level={1} className={layout.pageTitle}>
          {t('usage.title')}
        </Heading>
        <Paragraph size="sm" color="muted" className={layout.pageSubtitle}>
          {t('usage.subtitle')}
        </Paragraph>
      </header>
      <Card className={layout.usagePanel}>
        <Card.Content className={layout.usageContent}>
          <ComputeWallet targetType={WALLET_TARGET_TYPE.USER} canRecharge surface="plain" />
          <QuotaByGroup
            pagination={{
              defaultPageSize: 10,
            }}
          />
        </Card.Content>
      </Card>
    </div>
  );
}

export default Usage;
