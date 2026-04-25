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

export async function verifySalonAccess(): Promise<{ id: number; slug: string }> {
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
        select: { id: true, slug: true }
    });

    if (!profile) throw new Error('Доступ запрещен. Требуется профиль типа САЛОН.');
    return { id: profile.id, slug: profile.slug };
}

export async function createStaff(input: StaffInput) {
    try {
        const { id: profileId, slug: profileSlug } = await verifySalonAccess();
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
        revalidatePath(`/salon/${profileSlug}`);
        return { success: true, staffId: staff.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteStaff(staffId: string) {
    try {
        const { id: profileId, slug: profileSlug } = await verifySalonAccess();
        await prisma.staff.deleteMany({
            where: { id: staffId, profileId } // profileId ensures they own it
        });
        revalidatePath('/dashboard');
        revalidatePath(`/salon/${profileSlug}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Ошибка при удалении мастера' };
    }
}

export async function updateStaffProfile(
    staffId: string,
    data: {
        name: string;
        specialty?: string;
        bio?: string;
        experience?: string;
        rating?: number;
        tags?: string[];
    }
) {
    try {
        const { id: profileId, slug: profileSlug } = await verifySalonAccess();
        await verifyStaffOwnership(staffId, profileId);

        if (!data.name || data.name.trim().length < 2) {
            return { success: false, error: 'Введите корректное имя' };
        }

        let rating: number | undefined;
        if (data.rating !== undefined) {
            const parsed = Number(data.rating);
            if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
                return { success: false, error: 'Рейтинг должен быть числом от 0 до 5' };
            }
            rating = Math.round(parsed * 10) / 10;
        }

        const tags = data.tags
            ? data.tags.map((t) => t.trim()).filter((t) => t.length > 0).slice(0, 12)
            : undefined;

        await prisma.staff.updateMany({
            where: { id: staffId, profileId },
            data: {
                name: data.name.trim(),
                specialty: data.specialty?.trim() || null,
                bio: data.bio?.trim() || null,
                experience: data.experience?.trim() || null,
                ...(rating !== undefined ? { rating } : {}),
                ...(tags !== undefined ? { tags } : {}),
            }
        });

        revalidatePath('/dashboard');
        revalidatePath(`/salon/${profileSlug}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Ошибка при обновлении профиля' };
    }
}

// Updating staff schedule (legacy JSON-based, kept for backward compat)
export async function updateStaffSchedule(staffId: string, schedule: any) {
    try {
        const { id: profileId, slug: profileSlug } = await verifySalonAccess();
        await prisma.staff.updateMany({
            where: { id: staffId, profileId },
            data: { schedule }
        });
        revalidatePath('/dashboard');
        revalidatePath(`/salon/${profileSlug}`);
        return { success: true };
    } catch (error: any) {
         return { success: false, error: 'Ошибка при сохранении расписания' };
    }
}

export interface StaffAvailabilityDay {
    dayOfWeek: number;   // 0 = Sunday ... 6 = Saturday
    isWorking: boolean;
    startTime: string;   // "HH:MM"
    endTime: string;     // "HH:MM"
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateDay(d: StaffAvailabilityDay): string | null {
    if (!Number.isInteger(d.dayOfWeek) || d.dayOfWeek < 0 || d.dayOfWeek > 6) {
        return 'Некорректный день недели';
    }
    if (!TIME_PATTERN.test(d.startTime) || !TIME_PATTERN.test(d.endTime)) {
        return 'Некорректный формат времени (HH:MM)';
    }
    if (d.isWorking && d.startTime >= d.endTime) {
        return 'Время начала должно быть раньше окончания';
    }
    return null;
}

async function verifyStaffOwnership(staffId: string, profileId: number) {
    const staff = await prisma.staff.findFirst({
        where: { id: staffId, profileId },
        select: { id: true },
    });
    if (!staff) throw new Error('Мастер не найден');
}

export async function getStaffAvailability(staffId: string) {
    try {
        const { id: profileId } = await verifySalonAccess();
        await verifyStaffOwnership(staffId, profileId);

        const rows = await prisma.staffAvailability.findMany({
            where: { staffId },
            orderBy: { dayOfWeek: 'asc' },
        });

        return {
            success: true as const,
            availability: rows.map((r) => ({
                dayOfWeek: r.dayOfWeek,
                isWorking: r.isWorking,
                startTime: r.startTime,
                endTime: r.endTime,
            })),
        };
    } catch (error: any) {
        return { success: false as const, error: error.message || 'Ошибка при загрузке расписания' };
    }
}

export async function updateStaffAvailability(
    staffId: string,
    days: StaffAvailabilityDay[]
) {
    try {
        const { id: profileId, slug: profileSlug } = await verifySalonAccess();
        await verifyStaffOwnership(staffId, profileId);

        for (const d of days) {
            const err = validateDay(d);
            if (err) return { success: false, error: err };
        }

        await prisma.$transaction(
            days.map((d) =>
                prisma.staffAvailability.upsert({
                    where: { staffId_dayOfWeek: { staffId, dayOfWeek: d.dayOfWeek } },
                    create: {
                        staffId,
                        dayOfWeek: d.dayOfWeek,
                        isWorking: d.isWorking,
                        startTime: d.startTime,
                        endTime: d.endTime,
                    },
                    update: {
                        isWorking: d.isWorking,
                        startTime: d.startTime,
                        endTime: d.endTime,
                    },
                })
            )
        );

        revalidatePath('/dashboard');
        revalidatePath(`/salon/${profileSlug}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Ошибка при сохранении расписания' };
    }
}
