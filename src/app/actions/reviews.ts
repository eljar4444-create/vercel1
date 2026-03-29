'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function submitReview(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Требуется войти в аккаунт' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован' };
    }

    const bookingId = parseInt(formData.get('bookingId') as string, 10);
    const rating = parseInt(formData.get('rating') as string, 10);
    const comment = (formData.get('comment') as string)?.trim() || null;

    if (isNaN(bookingId) || isNaN(rating) || rating < 1 || rating > 5) {
        return { success: false, error: 'Некорректные данные отзыва' };
    }

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { profile: { select: { slug: true } } }
        });

        if (!booking) {
            return { success: false, error: 'Запись не найдена' };
        }

        if (booking.user_id !== session.user.id) {
            return { success: false, error: 'Вы не можете оставить отзыв на чужую запись' };
        }

        if (booking.status === 'canceled' || booking.status === 'rejected') {
            return { success: false, error: 'Нельзя оставить отзыв на отмененную запись' };
        }

        const existingReview = await prisma.review.findUnique({
            where: { bookingId }
        });

        if (existingReview) {
            return { success: false, error: 'Вы уже оставили отзыв для этой записи' };
        }

        await prisma.review.create({
            data: {
                profileId: booking.profile_id,
                clientId: session.user.id,
                bookingId: bookingId,
                rating,
                comment,
            }
        });

        if (booking.profile?.slug) {
            revalidatePath(`/salon/${booking.profile.slug}`);
        }
        revalidatePath('/dashboard');

        return { success: true };
    } catch (error: any) {
        console.error('submitReview error:', error);
        return { success: false, error: 'Ошибка сервера при сохранении отзыва' };
    }
}
