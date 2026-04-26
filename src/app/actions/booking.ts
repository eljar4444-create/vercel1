'use server';

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
    getDayIntervals,
    parseSchedule,
    weekdayFromDateString,
    type TimeInterval,
} from '@/lib/scheduling';
import { calculateSlots, normalizeDuration } from '@/lib/booking/slots';
import { auth } from '@/auth';
import { inngest } from '@/inngest/client';
import { checkBanned } from '@/lib/requireNotBanned';
import { upsertClientOnBookingCreated } from '@/lib/client/upsert';

type StaffAvailMap = Map<string, { isWorking: boolean; startTime: string; endTime: string }>;

const availKey = (staffId: string, dayOfWeek: number) => `${staffId}:${dayOfWeek}`;

async function loadStaffAvailability(
    db: Prisma.TransactionClient | typeof prisma,
    staffIds: string[]
): Promise<StaffAvailMap> {
    const map: StaffAvailMap = new Map();
    if (staffIds.length === 0) return map;
    const rows = await db.staffAvailability.findMany({
        where: { staffId: { in: staffIds } },
        select: { staffId: true, dayOfWeek: true, isWorking: true, startTime: true, endTime: true },
    });
    for (const r of rows) {
        map.set(availKey(r.staffId, r.dayOfWeek), {
            isWorking: r.isWorking,
            startTime: r.startTime,
            endTime: r.endTime,
        });
    }
    return map;
}

// StaffAvailability (relational) > staff.schedule (legacy JSON) > profile.schedule (salon).
function resolveWorkIntervals(
    staffId: string | null,
    weekday: number,
    availMap: StaffAvailMap,
    legacyStaffSchedule: Prisma.JsonValue | null | undefined,
    salonSchedule: Prisma.JsonValue | null | undefined
): TimeInterval[] {
    if (staffId) {
        const override = availMap.get(availKey(staffId, weekday));
        if (override) {
            if (!override.isWorking) return [];
            if (override.startTime >= override.endTime) return [];
            return [{ start: override.startTime, end: override.endTime }];
        }
    }
    return getDayIntervals(parseSchedule(legacyStaffSchedule ?? salonSchedule ?? null), weekday);
}

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

// Calculate slots for ONE specific staff (or solo) context given pre-resolved intervals.
async function fetchSingleEntitySlots(
    db: Prisma.TransactionClient | typeof prisma,
    profileId: number,
    date: string,
    serviceDuration: number,
    workIntervals: TimeInterval[],
    staffId: string | null
) {
    if (workIntervals.length === 0) return [];

    const busyWhere: any = {
        profile_id: profileId,
        date: new Date(date),
        status: { in: ['PENDING', 'CONFIRMED'] },
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

    const weekday = weekdayFromDateString(date);
    const availMap = await loadStaffAvailability(db, profile.staff.map(s => s.id));

    if (requestedStaffId) {
        const staff = profile.staff.find(s => s.id === requestedStaffId);
        if (!staff) return [];
        const intervals = resolveWorkIntervals(staff.id, weekday, availMap, staff.schedule, profile.schedule);
        return fetchSingleEntitySlots(db, profileId, date, serviceDuration, intervals, staff.id);
    }

    const allSlots = new Set<string>();

    if (profile.staff && profile.staff.length > 0) {
        for (const staff of profile.staff) {
            const intervals = resolveWorkIntervals(staff.id, weekday, availMap, staff.schedule, profile.schedule);
            const slots = await fetchSingleEntitySlots(db, profileId, date, serviceDuration, intervals, staff.id);
            slots.forEach(s => allSlots.add(s));
        }
    }

    const intervals = resolveWorkIntervals(null, weekday, availMap, null, profile.schedule);
    const soloSlots = await fetchSingleEntitySlots(db, profileId, date, serviceDuration, intervals, null);
    soloSlots.forEach(s => allSlots.add(s));

    return Array.from(allSlots).sort();
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
                status: { in: ['PENDING', 'CONFIRMED'] },
            },
            select: {
                date: true,
                time: true,
                staff_id: true,
                service: { select: { duration_min: true } },
            },
        });

        const availMap = await loadStaffAvailability(prisma, profile.staff.map(s => s.id));
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
                const workIntervals = resolveWorkIntervals(staff.id, weekday, availMap, staff.schedule, profile.schedule);
                const staffBookings = daysBookings.filter(b => b.staff_id === staff.id);
                weekSlots[dateStr] = workIntervals.length > 0 ? calculateSlots(workIntervals, duration, staffBookings) : [];
            } else {
                const dayUnionSlots = new Set<string>();

                if (profile.staff && profile.staff.length > 0) {
                    for (const staff of profile.staff) {
                        const workIntervals = resolveWorkIntervals(staff.id, weekday, availMap, staff.schedule, profile.schedule);
                        if (workIntervals.length === 0) continue;
                        const staffBookings = daysBookings.filter(b => b.staff_id === staff.id);
                        const slots = calculateSlots(workIntervals, duration, staffBookings);
                        slots.forEach(s => dayUnionSlots.add(s));
                    }
                }

                const soloWorkIntervals = resolveWorkIntervals(null, weekday, availMap, null, profile.schedule);
                if (soloWorkIntervals.length > 0) {
                    const soloBookings = daysBookings.filter(b => b.staff_id === null);
                    const soloSlots = calculateSlots(soloWorkIntervals, duration, soloBookings);
                    soloSlots.forEach(s => dayUnionSlots.add(s));
                }

                weekSlots[dateStr] = Array.from(dayUnionSlots).sort();
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

            const profile = await tx.profile.findUnique({
                where: { id: profileId },
                select: { schedule: true, staff: { select: { id: true, schedule: true } } },
            });

            const staffIds = profile?.staff?.map(s => s.id) ?? [];
            const availMap = await loadStaffAvailability(tx, staffIds);
            const weekday = weekdayFromDateString(input.date);

            if (!assignedStaffId) {
                let foundStaff: string | null = null;
                
                if (profile && profile.staff && profile.staff.length > 0) {
                    for (const st of profile.staff) {
                        const intervals = resolveWorkIntervals(st.id, weekday, availMap, st.schedule, profile.schedule);
                        const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, intervals, st.id);
                        if (slots.includes(input.time)) {
                            foundStaff = st.id;
                            break;
                        }
                    }
                }

                if (!foundStaff) {
                    const intervals = resolveWorkIntervals(null, weekday, availMap, null, profile?.schedule ?? null);
                    const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, intervals, null);
                    if (!slots.includes(input.time)) {
                        throw new Error('Выбранное время уже занято у всех мастеров и салона. Обновите слоты и выберите другое время.');
                    }
                    assignedStaffId = null;
                } else {
                    assignedStaffId = foundStaff;
                }
            } else {
                const staff = profile?.staff.find(s => s.id === assignedStaffId);
                if (!staff) {
                    throw new Error('Мастер не найден.');
                }
                const intervals = resolveWorkIntervals(staff.id, weekday, availMap, staff.schedule, profile?.schedule ?? null);
                if (intervals.length === 0) {
                    throw new Error('Мастер не работает в выбранный день.');
                }
                const slots = await fetchSingleEntitySlots(tx, profileId, input.date, duration, intervals, assignedStaffId);
                if (!slots.includes(input.time)) {
                    throw new Error('Выбранное время недоступно у этого мастера.');
                }
            }

            const slotLock = `${profileId}::${assignedStaffId || 'solo'}::${input.date}::${input.time}`;

            const created = await tx.booking.create({
                data: {
                    profile_id: profileId,
                    service_id: serviceId,
                    staff_id: assignedStaffId,
                    user_id: session.user.id,
                    date: new Date(input.date),
                    time: input.time,
                    user_name: input.userName,
                    user_phone: input.userPhone,
                    status: 'PENDING',
                    slotLock,
                },
            });

            await upsertClientOnBookingCreated(tx, {
                profileId,
                name: input.userName,
                phone: input.userPhone,
            });

            return created;
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
            return { success: false, error: 'К сожалению, это время только что было занято другим клиентом.' };
        }
        return { success: false, error: error.message || 'Ошибка при создании записи' };
    }
}
