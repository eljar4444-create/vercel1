import { describe, it, expect } from 'vitest';
import {
    timeToMinutes,
    minutesToTime,
    weekdayFromDateString,
    parseSchedule,
    getDayIntervals,
    isValidTime,
    validateIntervals,
    DEFAULT_SCHEDULE,
} from '@/lib/scheduling';

// ──────────────────────────────────────────────────────────
// Suite 1.1 — timeToMinutes / minutesToTime
// ──────────────────────────────────────────────────────────
describe('timeToMinutes', () => {
    it('converts "00:00" to 0', () => {
        expect(timeToMinutes('00:00')).toBe(0);
    });

    it('converts "10:30" to 630', () => {
        expect(timeToMinutes('10:30')).toBe(630);
    });

    it('converts "23:59" to 1439', () => {
        expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('converts "12:00" to 720', () => {
        expect(timeToMinutes('12:00')).toBe(720);
    });
});

describe('minutesToTime', () => {
    it('converts 0 to "00:00"', () => {
        expect(minutesToTime(0)).toBe('00:00');
    });

    it('converts 630 to "10:30"', () => {
        expect(minutesToTime(630)).toBe('10:30');
    });

    it('converts 1439 to "23:59"', () => {
        expect(minutesToTime(1439)).toBe('23:59');
    });
});

describe('timeToMinutes ↔ minutesToTime round-trip', () => {
    const testTimes = ['00:00', '06:15', '10:30', '12:00', '18:45', '23:59'];

    it.each(testTimes)('round-trip for "%s"', (time) => {
        expect(minutesToTime(timeToMinutes(time))).toBe(time);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 1.2 — weekdayFromDateString
// ──────────────────────────────────────────────────────────
describe('weekdayFromDateString', () => {
    it('returns 1 for Monday (2026-03-30)', () => {
        expect(weekdayFromDateString('2026-03-30')).toBe(1);
    });

    it('returns 0 for Sunday (2026-03-29)', () => {
        expect(weekdayFromDateString('2026-03-29')).toBe(0);
    });

    it('returns 3 for Wednesday (2026-04-01)', () => {
        expect(weekdayFromDateString('2026-04-01')).toBe(3);
    });

    it('returns 6 for Saturday (2026-04-04)', () => {
        expect(weekdayFromDateString('2026-04-04')).toBe(6);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 1.3 — parseSchedule
// ──────────────────────────────────────────────────────────
describe('parseSchedule', () => {
    it('returns DEFAULT_SCHEDULE for null input', () => {
        const result = parseSchedule(null);
        expect(result.workingDays).toEqual(DEFAULT_SCHEDULE.workingDays);
        expect(result.startTime).toBe(DEFAULT_SCHEDULE.startTime);
        expect(result.endTime).toBe(DEFAULT_SCHEDULE.endTime);
    });

    it('returns DEFAULT_SCHEDULE for undefined input', () => {
        const result = parseSchedule(undefined);
        expect(result.workingDays).toEqual(DEFAULT_SCHEDULE.workingDays);
    });

    it('parses valid days array format', () => {
        const input = {
            days: [
                { day: 1, intervals: [{ start: '09:00', end: '17:00' }] },
                { day: 3, intervals: [{ start: '10:00', end: '18:00' }] },
            ],
        };
        const result = parseSchedule(input);
        expect(result.workingDays).toEqual([1, 3]);
        expect(result.days).toHaveLength(2);
        expect(result.days[0].intervals[0].start).toBe('09:00');
    });

    it('parses legacy format with workingDays + startTime + endTime', () => {
        const input = {
            workingDays: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '16:00',
        };
        const result = parseSchedule(input);
        expect(result.workingDays).toEqual([1, 2, 3, 4, 5]);
        expect(result.startTime).toBe('08:00');
        expect(result.endTime).toBe('16:00');
    });

    it('falls back to DEFAULT_SCHEDULE for corrupt JSON object', () => {
        const result = parseSchedule({ garbage: true, foo: 'bar' });
        expect(result.workingDays).toEqual(DEFAULT_SCHEDULE.workingDays);
    });

    it('falls back to DEFAULT_SCHEDULE for empty days array', () => {
        const result = parseSchedule({ days: [] });
        expect(result.workingDays).toEqual(DEFAULT_SCHEDULE.workingDays);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 1.4 — getDayIntervals
// ──────────────────────────────────────────────────────────
describe('getDayIntervals', () => {
    const schedule = parseSchedule({
        days: [
            { day: 1, intervals: [{ start: '10:00', end: '18:00' }] },
            { day: 3, intervals: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
        ],
    });

    it('returns intervals for a working day', () => {
        const intervals = getDayIntervals(schedule, 1);
        expect(intervals).toHaveLength(1);
        expect(intervals[0]).toEqual({ start: '10:00', end: '18:00' });
    });

    it('returns multiple intervals if the day has a break', () => {
        const intervals = getDayIntervals(schedule, 3);
        expect(intervals).toHaveLength(2);
    });

    it('returns empty array for a non-working day', () => {
        expect(getDayIntervals(schedule, 0)).toEqual([]);
        expect(getDayIntervals(schedule, 6)).toEqual([]);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 1.5 — isValidTime
// ──────────────────────────────────────────────────────────
describe('isValidTime', () => {
    it('accepts "10:30"', () => {
        expect(isValidTime('10:30')).toBe(true);
    });

    it('accepts "00:00"', () => {
        expect(isValidTime('00:00')).toBe(true);
    });

    it('accepts "23:59"', () => {
        expect(isValidTime('23:59')).toBe(true);
    });

    it('rejects "25:00" (invalid hour)', () => {
        expect(isValidTime('25:00')).toBe(false);
    });

    it('rejects "10:60" (invalid minute)', () => {
        expect(isValidTime('10:60')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isValidTime('')).toBe(false);
    });

    it('rejects null', () => {
        expect(isValidTime(null)).toBe(false);
    });

    it('rejects undefined', () => {
        expect(isValidTime(undefined)).toBe(false);
    });

    it('rejects "1:30" (no leading zero)', () => {
        expect(isValidTime('1:30')).toBe(false);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 1.6 — validateIntervals
// ──────────────────────────────────────────────────────────
describe('validateIntervals', () => {
    it('returns error for empty array', () => {
        expect(validateIntervals([])).toBeTruthy();
    });

    it('returns null for a single valid interval', () => {
        expect(validateIntervals([{ start: '10:00', end: '18:00' }])).toBeNull();
    });

    it('returns error when end is before start', () => {
        expect(validateIntervals([{ start: '18:00', end: '10:00' }])).toBeTruthy();
    });

    it('returns error when end equals start', () => {
        expect(validateIntervals([{ start: '10:00', end: '10:00' }])).toBeTruthy();
    });

    it('returns null for non-overlapping intervals in order', () => {
        expect(validateIntervals([
            { start: '09:00', end: '12:00' },
            { start: '13:00', end: '18:00' },
        ])).toBeNull();
    });

    it('returns error for overlapping intervals', () => {
        expect(validateIntervals([
            { start: '09:00', end: '13:00' },
            { start: '12:00', end: '18:00' },
        ])).toBeTruthy();
    });
});
