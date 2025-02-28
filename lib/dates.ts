import {
  DateArg,
  formatDate as dfFormat,
  parseISO as dfParseISO,
} from "date-fns";

/**
 * formatDateTime - format a `Date` object as a string
 */
export function formatDateTime(
  utcDateObj: DateArg<Date> | null | undefined,
  format = "yyyy-MM-dd HH:mm:ss",
) {
  if (!utcDateObj) {
    return String(utcDateObj);
  }
  try {
    return dfFormat(utcDateObj, format);
  } catch (error) {
    console.error(error);
    return String(utcDateObj);
  }
}

/**
 * localDateTime - convert an ISO datetime string in UTC to a datetime string in the local timezone
 */
export function localDateTime(
  utcDateStr: string | null | undefined,
  format = "yyyy-MM-dd HH:mm:ss",
) {
  return formatDateTime(utcToLocal(utcDateStr), format);
}

/**
 * utcToLocal - convert an ISO datetime string in UTC to a `Date` object in the local timezone
 */
export function utcToLocal(utcDateStr: string | null | undefined) {
  if (!utcDateStr) {
    return utcDateStr;
  }
  try {
    utcDateStr = _addUtcTimezone(utcDateStr);
    return dfParseISO(utcDateStr);
  } catch (error) {
    console.error(error);
    return utcDateStr;
  }
}

/**
 * _addUtcTimezone - ensure the ISO datetime string in UTC has the "Z" timezone string at the end
 */
export function _addUtcTimezone(datetime: string) {
  return datetime.includes("Z") ? datetime : datetime + "Z";
}
