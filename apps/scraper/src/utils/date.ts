import { tz } from "@date-fns/tz";
import { parse } from "date-fns";

/**
 * IANA time zone identifier for Czech Republic.
 */
export const CZ_TIMEZONE = "Europe/Prague";

/**
 * Create a Date with the correct timezone offset.
 * @param dateStr date string in the given `format`
 * @param format date string format
 * @param timeZone time zone of the `dateStr`
 */
export const getLocalizedDate = (dateStr: string, format: string, timeZone: string) =>
  new Date(
    parse(dateStr, format, new Date(), {
      in: tz(timeZone),
    }).getTime()
  );
