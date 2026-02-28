'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createReview(bookingId: number, rating: number, comment?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Вы не авторизованы' };
        }

        if (rating < 1 || rating > 5) {
            return { success: false, error: 'Рейтинг должен быть от 1 до 5' };
        }

        const userId = session.user.id;

        // Verify booking exists, belongs to user, and is COMPLETED
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { profile: true, review: true }
        });

        if (!booking) {
            return { success: false, error: 'Запись не найдена' };
        }

        if (booking.user_id !== userId) {
            return { success: false, error: 'Это не ваша запись' };
        }

        if (booking.status !== 'completed' && booking.status !== 'COMPLETED') {
            return { success: false, error: 'Отзыв можно оставить только после завершения визита' };
        }

        if (booking.review) {
            return { success: false, error: 'Вы уже оставили отзыв к этой записи' };
        }

        // Create the review
        await prisma.review.create({
            data: {
                rating,
                comment: comment?.trim() || null,
                bookingId,
                clientId: userId,
                profileId: booking.profile_id,
            }
        });

        revalidatePath('/dashboard');
        revalidatePath(`/salon/${booking.profile.slug}`);

        return { success: true };
    } catch (error) {
        console.error('Ошибка при создании отзыва:', error);
        return { success: false, error: 'Произошла ошибка при сохранении отзыва' };
    }
}
