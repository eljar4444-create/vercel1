'use server';

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
    getDayIntervals,
    parseSchedule,
    weekdayFromDateString,
} from '@/lib/scheduling';
import { calculateSlots, normalizeDuration } from '@/lib/booking/slots';
import { auth } from '@/auth';
import { inngest } from '@/inngest/client';
import { checkBanned } from '@/lib/requireNotBanned';

interface BookingInput {
    profileId: number;
    staffId?: string | null;
    serviceId?: number | null;
    date: string;       // "2026-02-20"
    time: string;       // "14:00"
    userName: string;
    userPhone: string;
    serviceDuration?: number;
}

// Helper to calculate slots for ONE specific schedule/staff context
async function fetchSingleEntitySlots(
    db: Prisma.TransactionClient | typeof prisma,
    profileId: number,
    date: string,
    serviceDuration: number,
    scheduleRaw: Prisma.JsonValue | null,
    staffId: string | null
) {
    const schedule = parseSchedule(scheduleRaw);
    const weekday = weekdayFromDateString(date);
    const workIntervals = getDayIntervals(schedule, weekday);

    if (workIntervals.length === 0) return [];

    const busyWhere: any = {
        profile_id: profileId,
        date: new Date(date),
        status: { in: ['pending', 'confirmed'] },
    };

    if (staffId) {
        busyWhere.staff_id = staffId;
    } else {
        busyWhere.staff_id = null;
    }

    const busyBookings = await db.booking.findMany({
        where: busyWhere,
        select: {
            time: true,
            service: { select: { duration_min: true } },
        },
    });

    return calculateSlots(workIntervals, normalizeDuration(serviceDuration), busyBookings);
}

async function fetchAvailableSlots(
    db: Prisma.TransactionClient | typeof prisma,
    profileId: number,
    date: string,
    serviceDuration: number,
    requestedStaffId?: string | null
) {
    const profile = await db.profile.findUnique({
        where: { id: profileId },
        select: { schedule: true, staff: { select: { id: true, schedule: true } } },
    });

    if (!profile) return [];

    if (requestedStaffId) {
        const staff = profile.staff.find(s => s.id === requestedStaffId);
        if (!staff) return [];
        return fetchSingleEntitySlots(db, profileId, date, serviceDuration, staff.schedule || profile.schedule, staff.id);
    } 

    if (profile.staff && profile.staff.length > 0) {
        const allSlots = new Set<string>();
        for (const staff of profile.staff) {
            const slots = await fetchSingleEntitySlots(db, profileId, date, serviceDuration, staff.schedule || profile.schedule, staff.id);
            slots.forEach(s => allSlots.add(s));
        }
        return Array.from(allSlots).sort();
    } else {
        return fetchSingleEntitySlots(db, profileId, date, serviceDuration, profile.schedule, null);
    }
}

export async function getAvailableSlots(input: {
    profileId: number;
    staffId?: string | null;
    date: string;
    serviceDuration: number;
}) {
    const profileId = Number(input.profileId);
    const duration = normalizeDuration(Number(input.serviceDuration));

    if (!Number.isInteger(profileId) || !input.date) {
        return { success: false, slots: [] as string[], error: 'Некорректные параметры' };
    }

    try {
        const slots = await fetchAvailableSlots(prisma, profileId, input.date, duration, input.staffId);
        return { success: true, slots };
    } catch (error: any) {
        console.error('getAvailableSlots error:', error);
        return { success: false, slots: [] as string[], error: 'Ошибка загрузки слотов' };
    }
}

export async function getWeekAvailableSlots(input: {
    profileId: number;
    staffId?: string | null;
    startDate: string;
    serviceDuration: number;
}) {
    const profileId = Number(input.profileId);
    const duration = normalizeDuration(Number(input.serviceDuration));

    if (!Number.isInteger(profileId) || !input.startDate) {
        return { success: false, weekSlots: {} as Record<string, string[]>, error: 'Некорректные параметры' };
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { schedule: true, staff: { select: { id: true, schedule: true } } },
        });

        if (!profile) {
            return { success: true, weekSlots: {} };
        }

        const start = new Date(input.startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const busyBookings = await prisma.booking.findMany({
            where: {
                profile_id: profileId,
                date: {
                    gte: start,
                    lt: end,
                },
                status: { in: ['pending', 'confirmed'] },
            },
            select: {
                date: true,
                time: true,
                staff_id: true,
                service: { select: { duration_min: true } },
            },
        });

        const weekSlots: Record<string, string[]> = {};

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(start);
            currentDay.setDate(currentDay.getDate() + i);
            const dateStr = currentDay.toISOString().split('T')[0];
            const weekday = weekdayFromDateString(dateStr);
            
            const daysBookings = busyBookings.filter((b) => b.date.toISOString().split('T')[0] === dateStr);

            if (input.staffId) {
                const staff = profile.staff.find(s => s.id === input.staffId);
                if (!staff) {
                     weekSlots[dateStr] = [];
                     continue;
                }
                const workIntervals = getDayIntervals(parseSchedule(staff.schedule || profile.schedule), weekday);
                const staffBookings = daysBookings.filter(b => b.staff_id === staff.id);
                weekSlots[dateStr] = workIntervals.length > 0 ? calculateSlots(workIntervals, duration, staffBookings) : [];
            } else if (profile.staff && profile.staff.length > 0) {
                const dayUnionSlots = new Set<string>();
                for (const staff of profile.staff) {
                     const workIntervals = getDayIntervals(parseSchedule(staff.schedule || profile.schedule), weekday);
                     if (workIntervals.length === 0) continue;
                     const staffBookings = daysBookings.filter(b => b.staff_id === staff.id);
                     const slots = calculateSlots(workIntervals, duration, staffBookings);
                     slots.forEach(s => dayUnionSlots.add(s));
                }
                weekSlots[dateStr] = Array.from(dayUnionSlots).sort();
            } else {
                const workIntervals = getDayIntervals(parseSchedule(profile.schedule), weekday);
                const soloBookings = daysBookings.filter(b => b.staff_id === null);
                weekSlots[dateStr] = workIntervals.length > 0 ? calculateSlots(workIntervals, duration, soloBookings) : [];
            }
        }

        return { success: true, weekSlots };
    } catch (error: any) {
        console.error('getWeekAvailableSlots error:', error);
        return { success: false, weekSlots: {} as Record<string, string[]>, error: 'Ошибка загрузки расписания на неделю' };
    }
}

export async function createBooking(input: BookingInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Для бронирования нужно войти в аккаунт.' };
    }
    const banned = checkBanned(session);
    if (banned) return banned;

    const profileId = Number(input.profileId);
    const serviceId = input.serviceId ? Number(input.serviceId) : null;
    const serviceDuration = normalizeDuration(input.serviceDuration);

    if (!Number.isInteger(profileId) || !input.date || !input.time || !input.userName || !input.userPhone) {
        return { success: false, error: 'Пожалуйста, заполните все поля.' };
    }

    try {
        const booking = await prisma.$transaction(async (tx) => {
            let duration = serviceDuration;

            if (serviceId) {
                const service = await tx.service.findUnique({
                    where: { id: serviceId },
                    select: { duration_min: true, profile_id: true },
                });

                if (!service || service.profile_id !== profileId) {
                    throw new Error('Услуга не найдена');
                }

                duration = normalizeDuration(service.duration_min);
            }

            let assignedStaffId = input.staffId || null;

            if (!assignedStaffId) {
                const profile = await tx.profile.findUnique({
                    where: { id: profileId },
                    select: { schedule: true, staff: { select: { id: true, schedule: true } } },
                });
                
                if (profile && profile.staff && profile.staff.length > 0) {
                     let foundStaff = null;
                     for (const st of profile.staff) {
                         const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, st.schedule || profile.schedule, st.id);
                         if (slots.includes(input.time)) {
                             foundStaff = st.id;
                             break;
                         }
                     }
                     if (!foundStaff) {
                         throw new Error('Выбранное время уже занято у всех мастеров.');
                     }
                     assignedStaffId = foundStaff;
                } else {
                     const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, profile?.schedule || null, null);
                     if (!slots.includes(input.time)) {
                         throw new Error('Выбранное время уже занято. Обновите слоты и выберите другое время.');
                     }
                }
            } else {
                 const profile = await tx.profile.findUnique({
                    where: { id: profileId },
                    select: { schedule: true, staff: { select: { id: true, schedule: true } } },
                 });
                 const staff = profile?.staff.find(s => s.id === assignedStaffId);
                 const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, staff?.schedule || profile?.schedule || null, assignedStaffId);
                 if (!slots.includes(input.time)) {
                     throw new Error('Выбранное время уже занято.');
                 }
            }

            const slotLock = `${profileId}:${assignedStaffId || 'none'}:${input.date}:${input.time}`;

            return tx.booking.create({
                data: {
                    profile_id: profileId,
                    service_id: serviceId,
                    staff_id: assignedStaffId,
                    user_id: session.user.id,
                    date: new Date(input.date),
                    time: input.time,
                    user_name: input.userName,
                    user_phone: input.userPhone,
                    status: 'pending',
                    slotLock,
                },
            });
        }, {
            isolationLevel: 'Serializable',
        });

        // Async Inngest Notifications
        try {
            await Promise.allSettled([
                inngest.send({
                    name: 'booking/created',
                    data: { bookingId: booking.id }
                }),
                inngest.send({
                    name: 'booking.completed.review_request',
                    data: { bookingId: booking.id }
                })
            ]);
        } catch (inngestError) {
            console.error('Inngest Background Job Failed (Non-Fatal):', inngestError);
        }

        return { success: true, bookingId: booking.id };
    } catch (error: any) {
        console.error('Booking creation error:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'К сожалению, это время только что заняли. Пожалуйста, выберите другое.' };
        }
        return { success: false, error: error.message || 'Ошибка при создании записи' };
    }
}
