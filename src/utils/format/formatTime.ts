const padNumber = (value: number): string => String(value).padStart(2, '0');

type TimestampInput = number | string | Date | null | undefined;

/** 小于该绝对值视为秒级时间戳（约 2001-09 之前的毫秒戳也会落在此区间，业务上足够） */
const SECOND_TIMESTAMP_ABS_MAX = 1e12;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** 将秒/毫秒时间戳归一为毫秒 */
const toEpochMilliseconds = (value: number): number =>
  Math.abs(value) < SECOND_TIMESTAMP_ABS_MAX ? value * 1_000 : value;

/** 将时间戳 / 日期字符串 / Date 解析为有效 Date；无效则返回 null */
export const parseTimestampToDate = (timestamp?: TimestampInput): Date | null => {
  if (timestamp == null || timestamp === '') {
    return null;
  }

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }

  const timestampNumber = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  const date = Number.isFinite(timestampNumber)
    ? new Date(toEpochMilliseconds(timestampNumber))
    : new Date(String(timestamp));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/** 毫秒时间戳 / 日期字符串 / Date → `YYYY-MM-DD HH:mm:ss` */
export const formatTimestampToDateTime = (timestamp?: TimestampInput): string => {
  const date = parseTimestampToDate(timestamp);
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  const hour = padNumber(date.getHours());
  const minute = padNumber(date.getMinutes());
  const second = padNumber(date.getSeconds());

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

/** 毫秒时间戳 / 日期字符串 / Date → `YYYY-MM-DD` */
export const formatTimestampToDate = (timestamp?: TimestampInput): string => {
  const date = parseTimestampToDate(timestamp);
  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  return `${year}-${month}-${day}`;
};

const formatAbsoluteMedium = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

/** 相对时间（如「3 分钟前」）；超过 7 天回退到中等日期 + 短时间 */
export const formatRelativeTimestamp = (timestamp?: TimestampInput, locale = 'zh-CN'): string => {
  const date = parseTimestampToDate(timestamp);
  if (!date) {
    return '';
  }

  const diffMs = date.getTime() - Date.now();
  if (Math.abs(diffMs) >= SEVEN_DAYS_MS) {
    return formatAbsoluteMedium(date, locale);
  }

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffSeconds = Math.round(diffMs / 1_000);

  if (Math.abs(diffSeconds) < 60) {
    return formatter.format(diffSeconds, 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};
