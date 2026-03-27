import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addMinutes, parse, format, isBefore, isSameMinute, isValid } from 'date-fns';

export const DEFAULT_TIMEZONE = 'Europe/Berlin';

/**
 * Parses a "HH:mm" time string into a Date object on a specific day in a specific timezone,
 * and converts it to absolute UTC for backend storage.
 */
export function timeStringToUTC(timeString: string, baseDate: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): Date {
    const formattedDate = format(baseDate, 'yyyy-MM-dd');
    // For example "2024-03-27 09:00" in Berlin time
    const localDateTimeStr = `${formattedDate} ${timeString}`;
    
    // Parses string into a Date object as if it were local time in the specified timezone
    return fromZonedTime(localDateTimeStr, timezone);
}

/**
 * Formats a Date object back to "HH:mm" string localized to the timezone.
 */
export function formatToLocalTime(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
    return formatInTimeZone(date, timezone, 'HH:mm');
}

/**
 * Generate time slots in "HH:mm" format for a given time range and interval.
 * Range is strings "09:00"-"17:00".
 */
export function generateTimeSlots(startTime: string, endTime: string, intervalMin: number): string[] {
    const slots: string[] = [];
    if (!startTime || !endTime || intervalMin <= 0) return slots;

    const dummyDate = new Date().toISOString().split('T')[0];
    const start = parse(`${dummyDate} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(`${dummyDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    if (!isValid(start) || !isValid(end)) return slots;

    let current = start;
    while (isBefore(current, end) || isSameMinute(current, end)) {
        slots.push(format(current, 'HH:mm'));
        current = addMinutes(current, intervalMin);
    }

    return slots;
}
