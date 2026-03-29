import type { TimeInterval } from '@/lib/scheduling';
import { timeToMinutes, minutesToTime } from '@/lib/scheduling';

type BusyBooking = {
    time: string;
    service?: { duration_min: number } | null;
};

export function normalizeDuration(duration: number | undefined) {
    if (!duration || !Number.isFinite(duration)) return 60;
    return Math.max(15, Math.min(240, Math.floor(duration)));
}

export function calculateSlots(
    workIntervals: TimeInterval[],
    serviceDuration: number,
    busyBookings: BusyBooking[]
) {
    const busyIntervals = busyBookings.map((booking) => {
        const start = timeToMinutes(booking.time);
        const end = start + normalizeDuration(booking.service?.duration_min ?? serviceDuration);
        return { start, end };
    });

    const result: string[] = [];
    for (const interval of workIntervals) {
        const workStartMin = timeToMinutes(interval.start);
        const workEndMin = timeToMinutes(interval.end);

        for (let slotStart = workStartMin; slotStart + serviceDuration <= workEndMin; slotStart += serviceDuration) {
            const slotEnd = slotStart + serviceDuration;
            const overlaps = busyIntervals.some((busy) => slotStart < busy.end && slotEnd > busy.start);
            if (!overlaps) {
                result.push(minutesToTime(slotStart));
            }
        }
    }

    return result;
}
