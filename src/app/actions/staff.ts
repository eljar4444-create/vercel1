'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { checkBanned } from '@/lib/requireNotBanned';

interface StaffInput {
    name: string;
    bio?: string;
    avatarUrl?: string;
}

async function verifySalonAccess() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const banned = checkBanned(session);
    if (banned) throw new Error(banned.error);

    const profile = await prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: session.user.id },
                { user_email: session.user.email ?? undefined }
            ],
            provider_type: 'SALON'
        },
        select: { id: true }
    });

    if (!profile) throw new Error('Доступ запрещен. Требуется профиль типа САЛОН.');
    return profile.id;
}

export async function createStaff(input: StaffInput) {
    try {
        const profileId = await verifySalonAccess();
        if (!input.name || input.name.trim().length < 2) {
            return { success: false, error: 'Введите корректное имя' };
        }

        const staff = await prisma.staff.create({
            data: {
                profileId,
                name: input.name.trim(),
                bio: input.bio?.trim() || null,
                avatarUrl: input.avatarUrl || null,
            }
        });

        revalidatePath('/dashboard');
        return { success: true, staffId: staff.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteStaff(staffId: string) {
    try {
        const profileId = await verifySalonAccess();
        await prisma.staff.deleteMany({
            where: { id: staffId, profileId } // profileId ensures they own it
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Ошибка при удалении мастера' };
    }
}

// Updating staff schedule
export async function updateStaffSchedule(staffId: string, schedule: any) {
    try {
        const profileId = await verifySalonAccess();
        await prisma.staff.updateMany({
            where: { id: staffId, profileId },
            data: { schedule }
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
         return { success: false, error: 'Ошибка при сохранении расписания' };
    }
}
