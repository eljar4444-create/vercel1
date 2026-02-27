'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * Returns the Monday of the week containing the given date (local time).
 */
export function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Get provider's bookings for a given week (Monday–Sunday).
 * weekStart: "YYYY-MM-DD" (Monday).
 */
export async function getProviderBookingsForWeek(profileId: number, weekStart: string) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, bookings: [], error: 'Unauthorized' };
    }

    const profileIdNum = Number(profileId);
    if (!Number.isInteger(profileIdNum)) {
        return { success: false, bookings: [], error: 'Invalid profile id' };
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: profileIdNum },
            select: { id: true, user_id: true, user_email: true },
        });

        if (!profile) {
            return { success: false, bookings: [], error: 'Profile not found' };
        }

        if (session.user.role !== 'ADMIN') {
            const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
            const ownsByEmail = session.user.email && profile.user_email === session.user.email;
            if (!ownsByUserId && !ownsByEmail) {
                return { success: false, bookings: [], error: 'Forbidden' };
            }
        }

        const [y, m, d] = weekStart.split('-').map(Number);
        const startDate = new Date(y, (m ?? 1) - 1, d ?? 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(0, 0, 0, 0);

        const bookings = await prisma.booking.findMany({
            where: {
                profile_id: profileIdNum,
                date: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                service: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        duration_min: true,
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { time: 'asc' }],
        });

        const serialized = bookings.map((b) => ({
            id: b.id,
            date: b.date.toISOString(),
            time: b.time,
            user_id: b.user_id,
            user_name: b.user_name,
            user_phone: b.user_phone,
            status: b.status,
            created_at: b.created_at.toISOString(),
            user: b.user
                ? {
                    id: b.user.id,
                    name: b.user.name,
                    email: b.user.email,
                }
                : null,
            service: b.service
                ? {
                    id: b.service.id,
                    title: b.service.title,
                    price: Number(b.service.price),
                    duration_min: b.service.duration_min,
                }
                : null,
        }));

        return { success: true, bookings: serialized };
    } catch (err: unknown) {
        console.error('getProviderBookingsForWeek error:', err);
        return {
            success: false,
            bookings: [],
            error: err instanceof Error ? err.message : 'Failed to load bookings',
        };
    }
}
