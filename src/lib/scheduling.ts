export type WorkingSchedule = {
    workingDays: number[]; // 0-6, where 0 is Sunday
    startTime: string; // HH:MM
    endTime: string; // HH:MM
};

export const DEFAULT_SCHEDULE: WorkingSchedule = {
    workingDays: [1, 2, 3, 4, 5],
    startTime: '10:00',
    endTime: '18:00',
};

export function normalizeWorkingDays(days: unknown): number[] {
    if (!Array.isArray(days)) return DEFAULT_SCHEDULE.workingDays;
    const normalized = days
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

    if (!normalized.length) return DEFAULT_SCHEDULE.workingDays;
    return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

export function isValidTime(value: unknown): value is string {
    return typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function parseSchedule(raw: unknown): WorkingSchedule {
    if (!raw || typeof raw !== 'object') {
        return DEFAULT_SCHEDULE;
    }

    const schedule = raw as Record<string, unknown>;
    const startTime = isValidTime(schedule.startTime) ? schedule.startTime : DEFAULT_SCHEDULE.startTime;
    const endTime = isValidTime(schedule.endTime) ? schedule.endTime : DEFAULT_SCHEDULE.endTime;
    const workingDays = normalizeWorkingDays(schedule.workingDays);

    return { workingDays, startTime, endTime };
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
