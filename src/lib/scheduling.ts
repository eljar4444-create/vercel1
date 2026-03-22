export type TimeInterval = {
    start: string;
    end: string;
};

export type WorkingDaySchedule = {
    day: number; // 0-6, where 0 is Sunday
    intervals: TimeInterval[];
};

export type WorkingSchedule = {
    days: WorkingDaySchedule[];
    workingDays: number[];
    startTime: string;
    endTime: string;
};

const DEFAULT_INTERVAL: TimeInterval = {
    start: '10:00',
    end: '18:00',
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DEFAULT_SCHEDULE: WorkingSchedule = buildScheduleMeta(
    DAY_ORDER.slice(0, 5).map((day) => ({
        day,
        intervals: [{ ...DEFAULT_INTERVAL }],
    })),
);

function dayOrderIndex(day: number) {
    const index = DAY_ORDER.indexOf(day);
    return index === -1 ? DAY_ORDER.length : index;
}

function sortDays(days: WorkingDaySchedule[]) {
    return [...days].sort((a, b) => dayOrderIndex(a.day) - dayOrderIndex(b.day));
}

function toRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

export function normalizeWorkingDays(days: unknown): number[] {
    if (!Array.isArray(days)) return DEFAULT_SCHEDULE.workingDays;
    const normalized = days
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

    if (!normalized.length) return DEFAULT_SCHEDULE.workingDays;
    return Array.from(new Set(normalized)).sort((a, b) => dayOrderIndex(a) - dayOrderIndex(b));
}

export function isValidTime(value: unknown): value is string {
    return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function normalizeIntervals(raw: unknown): TimeInterval[] {
    if (!Array.isArray(raw)) return [];

    const normalized = raw
        .map((item) => {
            const record = toRecord(item);
            if (!record) return null;

            const start = record.start;
            const end = record.end;
            if (!isValidTime(start) || !isValidTime(end)) return null;
            if (timeToMinutes(end) <= timeToMinutes(start)) return null;

            return { start, end };
        })
        .filter((item): item is TimeInterval => Boolean(item));

    return normalized.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function validateIntervals(intervals: TimeInterval[]): string | null {
    if (intervals.length === 0) {
        return 'Добавьте хотя бы один интервал для активного дня.';
    }

    for (let index = 0; index < intervals.length; index += 1) {
        const interval = intervals[index];
        if (!isValidTime(interval.start) || !isValidTime(interval.end)) {
            return 'Введите корректное время в формате ЧЧ:ММ.';
        }

        const start = timeToMinutes(interval.start);
        const end = timeToMinutes(interval.end);
        if (end <= start) {
            return 'Время окончания должно быть позже времени начала.';
        }

        if (index > 0) {
            const previousEnd = timeToMinutes(intervals[index - 1].end);
            if (start < previousEnd) {
                return 'Интервалы внутри дня не должны пересекаться.';
            }
        }
    }

    return null;
}

export function normalizeDaySchedules(raw: unknown): WorkingDaySchedule[] {
    const source = Array.isArray(raw)
        ? raw
        : toRecord(raw)?.days && Array.isArray(toRecord(raw)?.days)
            ? toRecord(raw)?.days as unknown[]
            : null;

    if (source) {
        const byDay = new Map<number, TimeInterval[]>();

        for (const item of source) {
            const record = toRecord(item);
            if (!record) continue;

            const day = Number(record.day ?? record.dayId ?? record.id);
            if (!Number.isInteger(day) || day < 0 || day > 6) continue;

            const directIntervals = normalizeIntervals(record.intervals);
            const fallbackInterval =
                isValidTime(record.start) && isValidTime(record.end) && timeToMinutes(record.end) > timeToMinutes(record.start)
                    ? [{ start: record.start, end: record.end }]
                    : [];

            const intervals = directIntervals.length > 0 ? directIntervals : fallbackInterval;
            if (intervals.length === 0) continue;

            byDay.set(day, intervals);
        }

        return sortDays(
            Array.from(byDay.entries()).map(([day, intervals]) => ({
                day,
                intervals,
            })),
        );
    }

    const legacy = toRecord(raw);
    if (legacy) {
        const startTime = isValidTime(legacy.startTime) ? legacy.startTime : null;
        const endTime = isValidTime(legacy.endTime) ? legacy.endTime : null;
        const workingDays = normalizeWorkingDays(legacy.workingDays);

        if (startTime && endTime && timeToMinutes(endTime) > timeToMinutes(startTime)) {
            return workingDays.map((day) => ({
                day,
                intervals: [{ start: startTime, end: endTime }],
            }));
        }
    }

    return [];
}

function buildScheduleMeta(days: WorkingDaySchedule[]): WorkingSchedule {
    const normalizedDays = sortDays(
        days
            .map((day) => ({
                day: day.day,
                intervals: normalizeIntervals(day.intervals),
            }))
            .filter((day) => day.intervals.length > 0),
    );

    const flattenedIntervals = normalizedDays.flatMap((day) => day.intervals);

    const startTime = flattenedIntervals.length > 0
        ? flattenedIntervals.reduce((min, interval) => (
            timeToMinutes(interval.start) < timeToMinutes(min) ? interval.start : min
        ), flattenedIntervals[0].start)
        : DEFAULT_INTERVAL.start;

    const endTime = flattenedIntervals.length > 0
        ? flattenedIntervals.reduce((max, interval) => (
            timeToMinutes(interval.end) > timeToMinutes(max) ? interval.end : max
        ), flattenedIntervals[0].end)
        : DEFAULT_INTERVAL.end;

    return {
        days: normalizedDays,
        workingDays: normalizedDays.map((day) => day.day),
        startTime,
        endTime,
    };
}

export function createUniformSchedule(workingDays: number[], startTime: string, endTime: string): WorkingSchedule {
    if (!isValidTime(startTime) || !isValidTime(endTime) || timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        return DEFAULT_SCHEDULE;
    }

    return buildScheduleMeta(
        normalizeWorkingDays(workingDays).map((day) => ({
            day,
            intervals: [{ start: startTime, end: endTime }],
        })),
    );
}

export function buildSchedulePayload(days: WorkingDaySchedule[]) {
    const schedule = buildScheduleMeta(days);

    return {
        days: schedule.days,
        workingDays: schedule.workingDays,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
    };
}

export function parseSchedule(raw: unknown): WorkingSchedule {
    const normalizedDays = normalizeDaySchedules(raw);
    if (normalizedDays.length === 0) {
        return DEFAULT_SCHEDULE;
    }

    return buildScheduleMeta(normalizedDays);
}

export function getDayIntervals(schedule: WorkingSchedule, day: number): TimeInterval[] {
    return schedule.days.find((item) => item.day === day)?.intervals ?? [];
}

export function timeToMinutes(time: string) {
    const [h, m] = time.split(':').map((v) => Number(v));
    return h * 60 + m;
}

export function minutesToTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function weekdayFromDateString(date: string) {
    return new Date(`${date}T00:00:00`).getDay();
}
