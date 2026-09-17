import { TZDate } from "@date-fns/tz";
import { format, isValid, parseISO } from "date-fns";

export const AIDERA_TIME_ZONE = "Asia/Jakarta" as const;
export const DEFAULT_PUBLISH_HOUR = 9;

export function toJakartaDate(value: Date | string | number): TZDate {
  const date = value instanceof Date ? value : typeof value === "string" ? parseISO(value) : new Date(value);

  if (!isValid(date)) {
    throw new RangeError("Invalid date value");
  }

  return new TZDate(date, AIDERA_TIME_ZONE);
}

export function formatInJakarta(
  value: Date | string | number,
  pattern = "yyyy-MM-dd HH:mm:ss XXX",
): string {
  return format(toJakartaDate(value), pattern);
}

export function toJakartaIso(value: Date | string | number): string {
  return formatInJakarta(value, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function jakartaDateOnlyToIso(
  dateOnly: string,
  hour = DEFAULT_PUBLISH_HOUR,
  minute = 0,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);

  if (!match) {
    throw new RangeError("Date must use YYYY-MM-DD format");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new TZDate(year, month - 1, day, hour, minute, 0, AIDERA_TIME_ZONE);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
    || date.getHours() !== hour
    || date.getMinutes() !== minute
  ) {
    throw new RangeError("Invalid Jakarta calendar date");
  }

  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function isWithinCalendarRange(
  value: string,
  start?: string,
  end?: string,
): boolean {
  const timestamp = new Date(value).getTime();
  const afterStart = start === undefined || timestamp >= new Date(start).getTime();
  const beforeEnd = end === undefined || timestamp < new Date(end).getTime();

  return afterStart && beforeEnd;
}
