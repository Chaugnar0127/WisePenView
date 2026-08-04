const padNumber = (value: number): string => String(value).padStart(2, '0');

type TimestampInput = number | string | Date | null | undefined;

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
    ? new Date(timestampNumber)
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

/** 相对时间（如「3 分钟前」）；超过 7 天回退到中等日期 + 短时间 */
export const formatRelativeTimestamp = (timestamp?: TimestampInput, locale = 'zh-CN'): string => {
  const date = parseTimestampToDate(timestamp);
  if (!date) {
    return '';
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1_000));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (elapsedSeconds < 60) {
    return formatter.format(0, 'second');
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return formatter.format(-elapsedMinutes, 'minute');
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return formatter.format(-elapsedHours, 'hour');
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return formatter.format(-elapsedDays, 'day');
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
