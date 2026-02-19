'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import {
    CLIENT_PHONE_COOKIE,
    normalizePhone,
    findBookingsByPhone,
    buildBookingDateTime,
} from './lib';

export async function loginClientPortal(formData: FormData) {
    const phone = String(formData.get('phone') || '').trim();
    const normalized = normalizePhone(phone);

    if (normalized.length < 6) {
        return { success: false, error: 'Введите корректный номер телефона.' };
    }

    const bookings = await findBookingsByPhone(phone);

    if (!bookings.length) {
        return { success: false, error: 'По этому номеру записи не найдены.' };
    }

    const cookieStore = await cookies();
    cookieStore.set(CLIENT_PHONE_COOKIE, normalized, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
    });

    revalidatePath('/my-bookings');
    return { success: true };
}

export async function loginClientPortalState(
    _: { success: boolean; error: string | null },
    formData: FormData
) {
    const result = await loginClientPortal(formData);
    return {
        success: result.success,
        error: result.success ? null : result.error || 'Ошибка входа',
    };
}

export async function logoutClientPortal() {
    const cookieStore = await cookies();
    cookieStore.delete(CLIENT_PHONE_COOKIE);
    revalidatePath('/my-bookings');
}

export async function cancelClientBooking(formData: FormData) {
    const bookingId = Number(formData.get('booking_id'));
    if (!Number.isInteger(bookingId)) {
        return { success: false, error: 'Некорректный ID записи.' };
    }

    const cookieStore = await cookies();
    const phoneFromCookie = cookieStore.get(CLIENT_PHONE_COOKIE)?.value;

    if (!phoneFromCookie) {
        return { success: false, error: 'Сессия истекла. Войдите заново.' };
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            user_phone: true,
            status: true,
            date: true,
            time: true,
        },
    });

    if (!booking) {
        return { success: false, error: 'Запись не найдена.' };
    }

    const sameClient = normalizePhone(booking.user_phone) === normalizePhone(phoneFromCookie);
    if (!sameClient) {
        return { success: false, error: 'Недостаточно прав для отмены этой записи.' };
    }

    if (booking.status === 'cancelled') {
        return { success: false, error: 'Запись уже отменена.' };
    }

    const bookingDateTime = buildBookingDateTime(booking.date, booking.time);
    if (bookingDateTime.getTime() < Date.now()) {
        return { success: false, error: 'Нельзя отменить уже прошедшую запись.' };
    }

    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
    });

    revalidatePath('/my-bookings');
    return { success: true };
}
