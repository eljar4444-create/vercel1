import prisma from '@/lib/prisma';
import { parseSchedule, getDayIntervals, timeToMinutes, minutesToTime } from '@/lib/scheduling';
import { formatToLocalTime, timeStringToUTC } from '@/lib/utils/time';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';

export type Slot = {
    time: string; // "HH:mm"
    available: boolean;
};

export type DayAvailability = {
    date: string; // "yyyy-MM-dd"
    slots: Slot[];
};

export async function getProviderAvailability(
    profileId: number,
    startDate: Date,
    endDate: Date,
    serviceDurationMin: number = 60,
    intervalMin: number = 30
): Promise<DayAvailability[]> {
    // 1. Fetch Profile and Schedule
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { schedule: true }
    });

    if (!profile) throw new Error('Profile not found');

    const schedule = parseSchedule(profile.schedule);
    const dayAvailabilities: DayAvailability[] = [];

    // 2. Fetch all bookings in range in ONE query (O(1) DB calls instead of O(N) loops)
    const bookings = await prisma.booking.findMany({
        where: {
            profile_id: profileId,
            status: { not: 'CANCELED' },
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        select: {
            date: true,
            time: true,
            service: { select: { duration_min: true } }
        }
    });

    // Hash map for O(1) booking lookups by Date String
    // Map<"yyyy-MM-dd", Array<{startMin, endMin}>>
    const bookingMap = new Map<string, { startMin: number; endMin: number }[]>();
    
    for (const b of bookings) {
        // Assume default service duration if service is deleted
        const duration = b.service?.duration_min || 60; 
        const bStart = timeToMinutes(b.time);
        const bEnd = bStart + duration;
        
        // Strict UTC parsing to string to match local iterations
        const dateStr = format(b.date, 'yyyy-MM-dd');
        
        if (!bookingMap.has(dateStr)) {
            bookingMap.set(dateStr, []);
        }
        bookingMap.get(dateStr)!.push({ startMin: bStart, endMin: bEnd });
    }

    // 3. Generate slots for each day in the requested interval
    const daysToGenerate = eachDayOfInterval({ start: startDate, end: endDate });

    for (const currentDate of daysToGenerate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday
        const intervals = getDayIntervals(schedule, dayOfWeek);
        
        const daySlots: Slot[] = [];
        const dailyBookings = bookingMap.get(dateStr) || [];

        // Generate slots within the working intervals for this day
        for (const interval of intervals) {
            let currentStartMin = timeToMinutes(interval.start);
            const limitEndMin = timeToMinutes(interval.end);

            while (currentStartMin + serviceDurationMin <= limitEndMin) {
                const proposedEndMin = currentStartMin + serviceDurationMin;
                
                // Check against bookings
                const isOverlapping = dailyBookings.some(b => {
                    // Overlaps if (Start < BookingEnd) AND (End > BookingStart)
                    return (currentStartMin < b.endMin) && (proposedEndMin > b.startMin);
                });

                daySlots.push({
                    time: minutesToTime(currentStartMin),
                    available: !isOverlapping
                });

                // Advance by interval (e.g., 30 mins)
                currentStartMin += intervalMin;
            }
        }

        dayAvailabilities.push({
            date: dateStr,
            slots: daySlots
        });
    }

    return dayAvailabilities;
}
