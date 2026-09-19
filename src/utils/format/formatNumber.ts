/** 数字千分位格式化 */
export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const trimTrailingZero = (value: string): string => value.replace(/\.0$/, '');

/** 阅读量格式化：null/undefined → 0；0–999 直显；1000–9999 保留一位小数 + k（末尾 .0 省略）；≥10000 取整 + k */
export function formatReadCount(count: number | null | undefined): string {
  const n = count != null && Number.isFinite(count) && count >= 0 ? count : 0;
  if (n >= 10_000) return `${Math.floor(n / 1_000)}k`;
  if (n >= 1_000) return `${trimTrailingZero((n / 1_000).toFixed(1))}k`;
  return String(n);
}

/** 数字紧凑格式化（1.2K / 3.4M） */
export function formatCompactNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';

  const absNum = Math.abs(num);

  if (absNum >= 1_000_000) {
    return `${trimTrailingZero((num / 1_000_000).toFixed(1))}M`;
  }

  if (absNum >= 1_000) {
    return `${trimTrailingZero((num / 1_000).toFixed(1))}K`;
  }

  return formatNumber(num);
}

/** 百万单位格式化（计算点余额专用：100.0M） */
export function formatMillionNumber(num: number, locale?: string): string {
  if (!Number.isFinite(num)) return '0M';

  const value = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 1_000_000);

  return `${value}M`;
}
