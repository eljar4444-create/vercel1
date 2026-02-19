'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { buildBookingDateTime, findLegacyBookingsByPhone, normalizePhone } from './lib';
import { auth, signOut } from '@/auth';

export async function logoutClientPortal() {
    await signOut({ redirectTo: '/auth/login' });
}

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

    if (booking.status === 'cancelled') {
        return { success: false, error: 'Запись уже отменена' };
    }

    const bookingDateTime = buildBookingDateTime(booking.date, booking.time);
    if (bookingDateTime.getTime() < Date.now()) {
        return { success: false, error: 'Нельзя отменить прошедшую запись' };
    }

    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
    });

    revalidatePath('/my-bookings');
    return { success: true, error: null };
}

export async function cancelClientBooking(formData: FormData): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

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

    const bookingId = Number(formData.get('booking_id'));
    const result = await cancelClientBookingCore(session.user.id, bookingId);
    return { success: result.success, error: result.error };
}

export async function linkLegacyBookingsState(
    _: { success: boolean; error: string | null; linked: number },
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== 'CLIENT' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Войдите в клиентский аккаунт.', linked: 0 };
    }

    const phone = String(formData.get('phone') || '').trim();
    if (!phone) {
        return { success: false, error: 'Введите номер телефона.', linked: 0 };
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

    const updated = await prisma.booking.updateMany({
        where: {
            id: { in: ids },
            user_id: null,
        },
        data: { user_id: session.user.id },
    });

    revalidatePath('/my-bookings');
    return {
        success: true,
        error: null,
        linked: updated.count,
    };
}
