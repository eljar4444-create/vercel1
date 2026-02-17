'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateBookingStatus(bookingId: number, newStatus: string) {
    try {
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
