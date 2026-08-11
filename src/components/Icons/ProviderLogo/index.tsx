import { cn } from '@/utils/cn';
import claudeIcon from '@lobehub/icons-static-svg/icons/claude.svg?url';
import deepSeekIcon from '@lobehub/icons-static-svg/icons/deepseek.svg?url';
import doubaoIcon from '@lobehub/icons-static-svg/icons/doubao.svg?url';
import geminiIcon from '@lobehub/icons-static-svg/icons/gemini.svg?url';
import grokIcon from '@lobehub/icons-static-svg/icons/grok.svg?url';
import metaIcon from '@lobehub/icons-static-svg/icons/meta.svg?url';
import mistralIcon from '@lobehub/icons-static-svg/icons/mistral.svg?url';
import openAiIcon from '@lobehub/icons-static-svg/icons/openai.svg?url';
import qwenIcon from '@lobehub/icons-static-svg/icons/qwen.svg?url';
import type { ProviderLogoProps } from './index.type';
import styles from './style.module.less';

const PROVIDER_ICON_MAP: Record<string, string> = {
  anthropic: claudeIcon,
  claude: claudeIcon,
  deepseek: deepSeekIcon,
  doubao: doubaoIcon,
  gemini: geminiIcon,
  google: geminiIcon,
  grok: grokIcon,
  meta: metaIcon,
  mistral: mistralIcon,
  openai: openAiIcon,
  qwen: qwenIcon,
};

function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase();
}

function ProviderLogo({ provider, size = 16, className }: ProviderLogoProps) {
  const iconSrc = PROVIDER_ICON_MAP[normalizeProvider(provider)] ?? openAiIcon;

  return (
    <img
      className={cn(styles.logo, className)}
      src={iconSrc}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ width: size, height: size }}
    />
  );
}

export default ProviderLogo;
