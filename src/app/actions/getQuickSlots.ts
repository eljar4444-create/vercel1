'use server';

import prisma from '@/lib/prisma';
import { parseSchedule, timeToMinutes, minutesToTime, WorkingSchedule, weekdayFromDateString } from '@/lib/scheduling';
import { format, addDays, getDay, isBefore, isPast, parse } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

export type QuickSlot = {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    label: string; // e.g. "Вт 28"
    period: 'morning' | 'evening';
};

export type QuickSlotsResponse = {
    hasSchedule: boolean;
    morning: QuickSlot[];
    evening: QuickSlot[];
};

const DAYS_TO_CHECK = 7;
const SLOT_DURATION_MIN = 30; // 30 minutes slots
const MAX_SLOTS_PER_PERIOD = 3;

/**
 * Returns up to 3 morning and 3 evening available slots for a given provider within the next 7 days.
 */
export async function getQuickSlots(profileId: number): Promise<QuickSlotsResponse> {
    try {
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { schedule: true }
        });

        if (!profile || !profile.schedule) {
            return { hasSchedule: false, morning: [], evening: [] };
        }

        const schedule = parseSchedule(profile.schedule);
        if (!schedule.workingDays || schedule.workingDays.length === 0) {
            return { hasSchedule: false, morning: [], evening: [] };
        }

        // Fetch bookings for the next 7 days
        const TIMEZONE = 'Europe/Berlin';
        const nowZoned = toZonedTime(new Date(), TIMEZONE);
        const todayStr = format(nowZoned, 'yyyy-MM-dd');
        const endDateStr = format(addDays(nowZoned, DAYS_TO_CHECK), 'yyyy-MM-dd');

        const bookings = await prisma.booking.findMany({
            where: {
                profile_id: profileId,
                status: {
                    in: ['pending', 'confirmed']
                },
                date: {
                    gte: new Date(`${todayStr}T00:00:00Z`),
                    lte: new Date(`${endDateStr}T23:59:59Z`)
                }
            },
            select: {
                date: true,
                time: true,
                service: { select: { duration_min: true } }
            }
        });

        // Group bookings by date string (YYYY-MM-DD)
        const bookingsByDate: Record<string, { startMin: number; endMin: number }[]> = {};
        for (const b of bookings) {
            const dateStr = format(b.date, 'yyyy-MM-dd');
            if (!bookingsByDate[dateStr]) bookingsByDate[dateStr] = [];
            const startMin = timeToMinutes(b.time);
            const duration = b.service?.duration_min || 60; // fallback to 60 min if service deleted
            bookingsByDate[dateStr].push({ startMin, endMin: startMin + duration });
        }

        const morning: QuickSlot[] = [];
        const evening: QuickSlot[] = [];

        // Check days sequentially
        for (let i = 0; i < DAYS_TO_CHECK; i++) {
            const checkDate = addDays(nowZoned, i);
            const checkDateStr = format(checkDate, 'yyyy-MM-dd');
            const dayOfWeek = getDay(checkDate); // 0 = Sunday, 1 = Monday

            if (!schedule.workingDays.includes(dayOfWeek)) continue;

            const workStartMin = timeToMinutes(schedule.startTime);
            const workEndMin = timeToMinutes(schedule.endTime);
            const dayBookings = bookingsByDate[checkDateStr] || [];

            // Generate slots in 30min increments
            for (let min = workStartMin; min <= workEndMin - SLOT_DURATION_MIN; min += SLOT_DURATION_MIN) {
                // If checking today, skip past times
                if (i === 0) {
                    const currentHour = nowZoned.getHours();
                    const currentMinute = nowZoned.getMinutes();
                    const currentMinOfDay = currentHour * 60 + currentMinute;
                    if (min <= currentMinOfDay + 30) { // Add a 30 min buffer
                        continue;
                    }
                }

                // Check overlap with bookings
                const isOverlapping = dayBookings.some(b => {
                    const slotEnd = min + SLOT_DURATION_MIN;
                    // Strict overlap checking:
                    // slot starts during booking OR slot ends during booking OR slot encompasses booking
                    return (min >= b.startMin && min < b.endMin) ||
                        (slotEnd > b.startMin && slotEnd <= b.endMin) ||
                        (min <= b.startMin && slotEnd >= b.endMin);
                });

                if (!isOverlapping) {
                    const timeStr = minutesToTime(min);
                    // Determine Russian day label
                    const dayLabel = getRussianDayShort(dayOfWeek) + ' ' + format(checkDate, 'd');

                    const slot: QuickSlot = {
                        date: checkDateStr,
                        time: timeStr,
                        label: i === 0 ? 'Сегодня' : dayLabel,
                        period: min < 12 * 60 ? 'morning' : 'evening'
                    };

                    if (slot.period === 'morning' && morning.length < MAX_SLOTS_PER_PERIOD) {
                        morning.push(slot);
                    } else if (slot.period === 'evening' && evening.length < MAX_SLOTS_PER_PERIOD) {
                        evening.push(slot);
                    }

                    // Optimization: if we already have enough slots for both periods, break outer loop
                    if (morning.length >= MAX_SLOTS_PER_PERIOD && evening.length >= MAX_SLOTS_PER_PERIOD) {
                        return { hasSchedule: true, morning, evening };
                    }
                }
            }
        }

        return { hasSchedule: true, morning, evening };

    } catch (error) {
        console.error('Error fetching quick slots:', error);
        return { hasSchedule: false, morning: [], evening: [] };
    }
}

function getRussianDayShort(day: number): string {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[day];
}
