'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { buildBookingDateTime } from './lib';
import { auth, signOut } from '@/auth';

export async function logoutClientPortal() {
    await signOut({ redirectTo: '/auth/login' });
}

export async function cancelClientBooking(formData: FormData): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    const bookingId = Number(formData.get('booking_id'));
    if (!Number.isInteger(bookingId)) {
        return;
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
        return;
    }

    if (booking.user_id !== session.user.id) {
        return;
    }

    if (booking.status === 'cancelled') {
        return;
    }

    const bookingDateTime = buildBookingDateTime(booking.date, booking.time);
    if (bookingDateTime.getTime() < Date.now()) {
        return;
    }

    await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
    });

    revalidatePath('/my-bookings');
}
