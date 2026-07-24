import AppIconButton from '@/components/Button/AppIconButton';
import { getModKeyLabel } from '@/utils/platform';
import { useKeyPress } from 'ahooks';
import { Search } from 'lucide-react';
import { useState } from 'react';
import SearchModal from './SearchModal';
import type { GlobalSearchProps } from './index.type';

const SHORTCUT_LABEL = `${getModKeyLabel()}+K`;

/** 侧边栏图标按钮触发器 + 受控 Modal；监听 ctrl/⌘+K 打开 */
function GlobalSearch({ scope }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);

  useKeyPress(
    ['ctrl.k', 'meta.k'],
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
    { exactMatch: true }
  );

  return (
    <>
      <AppIconButton
        icon={<Search size={18} aria-hidden="true" />}
        label="全局搜索"
        tooltip={{ content: `全局搜索（${SHORTCUT_LABEL}）`, placement: 'bottom' }}
        onPress={() => setOpen(true)}
      />
      <SearchModal isOpen={open} scope={scope} onOpenChange={setOpen} />
    </>
  );
}

export default GlobalSearch;
