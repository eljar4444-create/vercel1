'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { buildBookingDateTime, findLegacyBookingsByPhone, normalizePhone } from './lib';
import { auth, signOut } from '@/auth';

export async function logoutClientPortal() {
    await signOut({ redirectTo: '/auth/login' });
}

// In-memory rate limiting map for legacy booking linking
const linkRateLimit = new Map<string, { count: number; resetTime: number }>();

async function cancelClientBookingCore(userId: string, bookingId: number) {
    if (!Number.isInteger(bookingId)) {
        return { success: false, error: 'Некорректная запись' };
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            user_id: true,
            status: true,
            date: true,
            time: true,
        },
    });

    if (!booking) {
        return { success: false, error: 'Запись не найдена' };
    }

    if (booking.user_id !== userId) {
        return { success: false, error: 'Недостаточно прав' };
    }

    if (booking.status === 'CANCELED') {
        return { success: false, error: 'Запись уже отменена' };
    }

    const bookingDateTime = buildBookingDateTime(booking.date, booking.time);
    if (bookingDateTime.getTime() < Date.now()) {
        return { success: false, error: 'Нельзя отменить прошедшую запись' };
    }

    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELED', canceledBy: 'CLIENT' },
    });

    revalidatePath('/dashboard');
    return { success: true, error: null };
}

export async function cancelClientBooking(formData: FormData): Promise<void> {
    const session = await auth();
    if (!session?.user?.id || session.user.isBanned) return;

    const bookingId = Number(formData.get('booking_id'));
    await cancelClientBookingCore(session.user.id, bookingId);
}

export async function cancelClientBookingState(
    _: { success: boolean; error: string | null },
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Войдите в аккаунт' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    const bookingId = Number(formData.get('booking_id'));
    const result = await cancelClientBookingCore(session.user.id, bookingId);
    return { success: result.success, error: result.error };
}

export async function linkLegacyBookingsState(
    _: { success: boolean; error: string | null; linked: number },
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Войдите в клиентский аккаунт.', linked: 0 };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.', linked: 0 };
    }

    const phone = String(formData.get('phone') || '').trim();
    if (!phone) {
        return { success: false, error: 'Введите номер телефона.', linked: 0 };
    }

    const NOW = Date.now();
    const WINDOW_MS = 60 * 60 * 1000; // 1 hour
    const userId = session.user.id;
    const record = linkRateLimit.get(userId);

    if (record) {
        if (NOW > record.resetTime) {
            linkRateLimit.set(userId, { count: 1, resetTime: NOW + WINDOW_MS });
        } else {
            if (record.count >= 5) {
                return { success: false, error: 'Слишком много попыток. Попробуйте через час.', linked: 0 };
            }
            record.count += 1;
            linkRateLimit.set(userId, record);
        }
    } else {
        linkRateLimit.set(userId, { count: 1, resetTime: NOW + WINDOW_MS });
    }

    const legacy = await findLegacyBookingsByPhone(phone);
    if (!legacy.length) {
        return { success: false, error: 'Не найдено старых записей для привязки.', linked: 0 };
    }

    const normalizedInput = normalizePhone(phone);
    const ids = legacy
        .filter((booking) => normalizePhone(booking.user_phone) === normalizedInput)
        .map((booking) => booking.id);

    if (!ids.length) {
        return { success: false, error: 'Не найдено совпадений.', linked: 0 };
    }

    if (ids.length > 20) {
        return { success: false, error: 'Слишком много записей для автоматической привязки. Обратитесь в поддержку.', linked: 0 };
    }

    const updated = await prisma.booking.updateMany({
        where: {
            id: { in: ids },
            user_id: null,
        },
        data: { user_id: session.user.id },
    });

    revalidatePath('/dashboard');
    return {
        success: true,
        error: null,
        linked: updated.count,
    };
}
