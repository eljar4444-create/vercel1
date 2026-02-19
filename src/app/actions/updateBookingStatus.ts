'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function updateBookingStatus(bookingId: number, newStatus: string) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                profile_id: true,
                profile: {
                    select: {
                        user_id: true,
                        user_email: true,
                    },
                },
            },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        if (session.user.role !== 'ADMIN') {
            const ownsByUserId = booking.profile.user_id && booking.profile.user_id === session.user.id;
            const ownsByEmail = session.user.email && booking.profile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Forbidden' };
            }
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: newStatus },
        });

        // Revalidate all dashboard pages so the UI refreshes instantly
        revalidatePath('/dashboard', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Update booking status error:', error);
        return { success: false, error: error.message || 'Ошибка при обновлении статуса' };
    }
}
