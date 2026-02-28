'use server';

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
    parseSchedule,
    timeToMinutes,
    minutesToTime,
    weekdayFromDateString,
} from '@/lib/scheduling';
import { auth } from '@/auth';
import { sendTelegramMessage } from '@/lib/telegram';

interface BookingInput {
    profileId: number;
    serviceId?: number | null;
    date: string;       // "2026-02-20"
    time: string;       // "14:00"
    userName: string;
    userPhone: string;
    serviceDuration?: number;
}

type BusyBooking = {
    time: string;
    service?: { duration_min: number } | null;
};

function normalizeDuration(duration: number | undefined) {
    if (!duration || !Number.isFinite(duration)) return 60;
    return Math.max(15, Math.min(240, Math.floor(duration)));
}

function calculateSlots(
    workStartMin: number,
    workEndMin: number,
    serviceDuration: number,
    busyBookings: BusyBooking[]
) {
    const busyIntervals = busyBookings.map((booking) => {
        const start = timeToMinutes(booking.time);
        const end = start + normalizeDuration(booking.service?.duration_min ?? serviceDuration);
        return { start, end };
    });

    const result: string[] = [];
    for (let slotStart = workStartMin; slotStart + serviceDuration <= workEndMin; slotStart += serviceDuration) {
        const slotEnd = slotStart + serviceDuration;
        const overlaps = busyIntervals.some((busy) => slotStart < busy.end && slotEnd > busy.start);
        if (!overlaps) {
            result.push(minutesToTime(slotStart));
        }
    }

    return result;
}

async function fetchAvailableSlots(
    db: Prisma.TransactionClient | typeof prisma,
    profileId: number,
    date: string,
    serviceDuration: number
) {
    const profile = await db.profile.findUnique({
        where: { id: profileId },
        select: { schedule: true },
    });

    if (!profile) return [];

    const schedule = parseSchedule(profile.schedule);
    const weekday = weekdayFromDateString(date);

    if (!schedule.workingDays.includes(weekday)) {
        return [];
    }

    const workStartMin = timeToMinutes(schedule.startTime);
    const workEndMin = timeToMinutes(schedule.endTime);
    if (workEndMin <= workStartMin) {
        return [];
    }

    const busyBookings = await db.booking.findMany({
        where: {
            profile_id: profileId,
            date: new Date(date),
            status: { in: ['pending', 'confirmed'] },
        },
        select: {
            time: true,
            service: {
                select: { duration_min: true },
            },
        },
    });

    return calculateSlots(workStartMin, workEndMin, normalizeDuration(serviceDuration), busyBookings);
}

export async function getAvailableSlots(input: {
    profileId: number;
    date: string;
    serviceDuration: number;
}) {
    const profileId = Number(input.profileId);
    const duration = normalizeDuration(Number(input.serviceDuration));

    if (!Number.isInteger(profileId) || !input.date) {
        return { success: false, slots: [] as string[], error: 'Некорректные параметры' };
    }

    try {
        const slots = await fetchAvailableSlots(prisma, profileId, input.date, duration);
        return { success: true, slots };
    } catch (error: any) {
        console.error('getAvailableSlots error:', error);
        return { success: false, slots: [] as string[], error: 'Ошибка загрузки слотов' };
    }
}

export async function createBooking(input: BookingInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Для бронирования нужно войти в аккаунт.' };
    }

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

            const slots = await fetchAvailableSlots(tx, profileId, input.date, duration);
            if (!slots.includes(input.time)) {
                throw new Error('Выбранное время уже занято. Обновите слоты и выберите другое время.');
            }

            return tx.booking.create({
                data: {
                    profile_id: profileId,
                    service_id: serviceId,
                    user_id: session.user.id,
                    date: new Date(input.date),
                    time: input.time,
                    user_name: input.userName,
                    user_phone: input.userPhone,
                    status: 'pending',
                },
            });
        }, {
            isolationLevel: 'Serializable',
        });

        // Уведомление мастеру в Telegram (не блокируем ответ клиенту)
        const masterProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { telegramChatId: true },
        });
        if (masterProfile?.telegramChatId) {
            let serviceTitle = 'Услуга уточняется';
            if (booking.service_id) {
                const svc = await prisma.service.findUnique({
                    where: { id: booking.service_id },
                    select: { title: true },
                });
                if (svc) serviceTitle = svc.title;
            }
            const dateStr = new Date(input.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            const escapeHtml = (s: string) =>
                String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            const message =
                '🎉 <b>Новая запись!</b>\n' +
                `👤 Клиент: ${escapeHtml(input.userName)}\n` +
                `✂️ Услуга: ${escapeHtml(serviceTitle)}\n` +
                `🗓 Время: ${dateStr}, ${escapeHtml(input.time)}`;
            sendTelegramMessage(masterProfile.telegramChatId, message).catch(() => {});
        }

        return { success: true, bookingId: booking.id };
    } catch (error: any) {
        console.error('Booking creation error:', error);
        return { success: false, error: error.message || 'Ошибка при создании записи' };
    }
}
