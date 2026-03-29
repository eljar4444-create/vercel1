'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { buildSchedulePayload, normalizeDaySchedules, validateIntervals } from '@/lib/scheduling';
import { auth } from '@/auth';
import { requireProviderProfile } from '@/lib/auth-helpers';

interface UpdateScheduleResult {
    success: boolean;
    error?: string;
}

export async function updateSchedule(formData: FormData): Promise<UpdateScheduleResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    if (session.user.role !== 'ADMIN') {
        try {
            await requireProviderProfile(session.user.id, session.user.email);
        } catch {
            return { success: false, error: 'Unauthorized' };
        }
    }

    const profileId = Number(formData.get('profile_id'));
    const rawSchedule = String(formData.get('schedule') || '');

    if (!Number.isInteger(profileId)) {
        return { success: false, error: 'Некорректный профиль.' };
    }

    let parsedSchedule: unknown;
    try {
        parsedSchedule = rawSchedule ? JSON.parse(rawSchedule) : [];
    } catch {
        return { success: false, error: 'Не удалось прочитать расписание.' };
    }

    const days = normalizeDaySchedules(parsedSchedule);
    if (days.length === 0) {
        return { success: false, error: 'Выберите хотя бы один рабочий день и задайте интервал.' };
    }

    for (const day of days) {
        const error = validateIntervals(day.intervals);
        if (error) {
            return { success: false, error };
        }
    }

    try {
        if (session.user.role !== 'ADMIN') {
            const profile = await prisma.profile.findUnique({
                where: { id: profileId },
                select: { user_id: true, user_email: true },
            });
            if (!profile) return { success: false, error: 'Профиль не найден.' };

            const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
            const ownsByEmail = session.user.email && profile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        await prisma.profile.update({
            where: { id: profileId },
            data: {
                schedule: buildSchedulePayload(days),
            },
        });

        const updatedProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { slug: true },
        });

        revalidatePath('/dashboard');
        if (updatedProfile?.slug) {
            revalidatePath(`/salon/${updatedProfile.slug}`);
        }
        return { success: true };
    } catch (error: any) {
        console.error('updateSchedule error:', error);
        return { success: false, error: 'Ошибка при сохранении расписания.' };
    }
}
