'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { del } from '@vercel/blob';

function isVercelBlobUrl(url: unknown): url is string {
    if (typeof url !== 'string' || url.length === 0) return false;
    try {
        return new URL(url).hostname.endsWith('.blob.vercel-storage.com');
    } catch {
        return false;
    }
}

// Best-effort cleanup of blob storage before the DB rows are removed.
// Cascade deletes nuke PortfolioPhoto/Profile rows but leave the actual
// files orphaned in storage — collect & delete them up front.
async function deleteBlobsForProfile(profileId: number): Promise<void> {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) return;

    const [profile, photos] = await Promise.all([
        prisma.profile.findUnique({
            where: { id: profileId },
            select: { image_url: true, gallery: true, studioImages: true },
        }),
        prisma.portfolioPhoto.findMany({
            where: { profileId },
            select: { url: true },
        }),
    ]);

    const urls = [
        profile?.image_url,
        ...(profile?.gallery ?? []),
        ...(profile?.studioImages ?? []),
        ...photos.map((p) => p.url),
    ].filter(isVercelBlobUrl);

    if (urls.length === 0) return;

    const results = await Promise.allSettled(urls.map((url) => del(url, { token })));
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
        console.warn(
            `[deleteUserAccount] ${failed.length}/${urls.length} blob deletions failed`,
            failed.map((r) => (r as PromiseRejectedResult).reason),
        );
    }
}

/**
 * Полностью удаляет аккаунт текущего пользователя и все связанные данные.
 * Используем транзакцию, так как не все FK имеют onDelete: Cascade.
 */
export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    const userId = session.user.id;

    try {
        const profileForBlobs = await prisma.profile.findUnique({
            where: { user_id: userId },
            select: { id: true },
        });
        if (profileForBlobs) {
            await deleteBlobsForProfile(profileForBlobs.id);
        }

        await prisma.$transaction(async (tx) => {
            // 1. Find user's profile (if any)
            const profile = await tx.profile.findUnique({
                where: { user_id: userId },
                select: { id: true },
            });

            if (profile) {
                // Delete favorites pointing to this provider
                await tx.favorite.deleteMany({ where: { providerProfileId: profile.id } });

                // Delete telegram tokens associated with profile
                await tx.telegramToken.deleteMany({ where: { profileId: profile.id } });

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
