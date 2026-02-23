'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * Полностью удаляет аккаунт текущего пользователя и все связанные данные.
 * Используем транзакцию, так как не все FK имеют onDelete: Cascade.
 */
export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }

    const userId = session.user.id;

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Find user's profile (if any)
            const profile = await tx.profile.findUnique({
                where: { user_id: userId },
                select: { id: true },
            });

            if (profile) {
                // 2. Delete services linked to profile
                await tx.service.deleteMany({ where: { profile_id: profile.id } });

                // 3. Delete bookings linked to profile (as provider)
                await tx.booking.deleteMany({ where: { profile_id: profile.id } });

                // 4. Delete conversations linked to profile (as provider)
                const providerConversations = await tx.conversation.findMany({
                    where: { providerProfileId: profile.id },
                    select: { id: true },
                });
                const providerConvIds = providerConversations.map((c) => c.id);
                if (providerConvIds.length > 0) {
                    await tx.message.deleteMany({ where: { conversationId: { in: providerConvIds } } });
                    await tx.conversation.deleteMany({ where: { id: { in: providerConvIds } } });
                }

                // 5. Delete profile itself
                await tx.profile.delete({ where: { id: profile.id } });
            }

            // 6. Nullify user's bookings (as client) — keeps booking history for providers
            await tx.booking.updateMany({
                where: { user_id: userId },
                data: { user_id: null },
            });

            // 7. Delete user (cascades: Account, Session, Conversation as client, Messages)
            await tx.user.delete({ where: { id: userId } });
        });

        return { success: true };
    } catch (error) {
        console.error('deleteUserAccount error:', error);
        return { success: false, error: 'Не удалось удалить аккаунт. Попробуйте позже.' };
    }
}
