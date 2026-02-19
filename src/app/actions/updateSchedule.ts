'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isValidTime, normalizeWorkingDays, timeToMinutes } from '@/lib/scheduling';
import { auth } from '@/auth';

interface UpdateScheduleResult {
    success: boolean;
    error?: string;
}

export async function updateSchedule(formData: FormData): Promise<UpdateScheduleResult> {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'Unauthorized' };
    }

    const profileId = Number(formData.get('profile_id'));
    const startTime = String(formData.get('start_time') || '');
    const endTime = String(formData.get('end_time') || '');
    const workingDaysRaw = formData.getAll('working_days').map((value) => Number(value));

    if (!Number.isInteger(profileId)) {
        return { success: false, error: 'Некорректный профиль.' };
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return { success: false, error: 'Введите корректное время работы.' };
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (endMin <= startMin) {
        return { success: false, error: 'Время окончания должно быть позже времени начала.' };
    }

    const workingDays = normalizeWorkingDays(workingDaysRaw);

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
                schedule: {
                    workingDays,
                    startTime,
                    endTime,
                },
            },
        });

        revalidatePath(`/dashboard/${profileId}`);
        revalidatePath(`/profile/${profileId}`);
        return { success: true };
    } catch (error: any) {
        console.error('updateSchedule error:', error);
        return { success: false, error: 'Ошибка при сохранении расписания.' };
    }
}
