'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { checkBanned } from '@/lib/requireNotBanned';

const APPROVED_PROVIDER_STATUS = 'PUBLISHED' as const;
const REJECTED_PROVIDER_STATUS = 'SUSPENDED' as const;

function parseProfileId(formData: FormData) {
    const profileId = Number(formData.get('profile_id'));
    if (!Number.isInteger(profileId)) {
        throw new Error('Некорректный ID заявки');
    }
    return profileId;
}

export async function approveMaster(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен');
    }
    const banned = checkBanned(session);
    if (banned) throw new Error(banned.error);

    const profileId = parseProfileId(formData);

    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { status: true } });
    if (!profile) throw new Error('Профиль не найден');
    if (profile.status !== 'PENDING_REVIEW') throw new Error('Профиль не находится в статусе ожидания проверки');

    const updated = await prisma.profile.update({
        where: { id: profileId },
        data: { is_verified: true, status: APPROVED_PROVIDER_STATUS },
        select: { slug: true, status: true },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/search');
    if (updated.slug) {
        revalidatePath(`/salon/${updated.slug}`);
    }

    return { ok: true, status: updated.status };
}

export async function rejectMaster(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен');
    }
    const banned = checkBanned(session);
    if (banned) throw new Error(banned.error);

    const profileId = parseProfileId(formData);

    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { status: true } });
    if (!profile) throw new Error('Профиль не найден');
    if (profile.status !== 'PENDING_REVIEW') throw new Error('Профиль не находится в статусе ожидания проверки');

    const updated = await prisma.profile.update({
        where: { id: profileId },
        // The current schema uses SUSPENDED as the rejected terminal status for providers.
        data: { is_verified: false, status: REJECTED_PROVIDER_STATUS },
        select: { slug: true, status: true },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/search');
    if (updated.slug) {
        revalidatePath(`/salon/${updated.slug}`);
    }

    return { ok: true, status: updated.status };
}

export async function checkAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }
    const banned = checkBanned(session);
    if (banned) {
        redirect('/');
    }
    return session.user;
}

export async function getAdminData() {
    console.log("--- ADMIN ACTION TRIGGERED ---");
    const session = await auth();
    console.log("SESSION IN ACTION:", session?.user);

    await checkAdmin();

    try {
        const [
            totalUsers,
            totalServices,
            activeProviders,
            totalBookings,
            completedBookings,
            canceledBookings,
            users,
            services,
            bookings,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.service.count(),
            prisma.profile.count({ where: { status: 'PUBLISHED' } }),
            prisma.booking.count(),
            prisma.booking.count({ where: { status: "completed" } }),
            prisma.booking.count({ where: { status: "canceled" } }),
            prisma.user.findMany({
                take: 100, // Hard cap to prevent memory exhaustion
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: {
                            bookings: true, // Bookings as a client
                        }
                    },
                    profile: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            city: true,
                            is_verified: true,
                            status: true,
                            _count: {
                                select: {
                                    services: true, // Services this master created
                                    bookings: true, // Bookings they received as a master
                                }
                            }
                        }
                    }
                }
            }),
            prisma.service.findMany({
                take: 100, // Hard cap to prevent memory exhaustion
                include: {
                    profile: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    role: true,
                                    createdAt: true,
                                }
                            }
                        },
                    },
                },
                orderBy: { id: "desc" },
            }),
            prisma.booking.findMany({
                take: 100, // Hard cap to prevent memory exhaustion
                include: {
                    service: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            createdAt: true,
                        }
                    },
                    profile: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    role: true,
                                    createdAt: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { date: "desc" },
            }),
        ]);

        return {
            totalUsers,
            totalServices,
            activeProviders,
            totalBookings,
            completedBookings,
            canceledBookings,
            users,
            services,
            bookings,
        };
    } catch (error) {
        console.error("PRISMA FETCH ERROR:", error);
        throw new Error(error instanceof Error ? error.message : "Ошибка базы данных");
    }
}

export async function toggleUserBan(userId: string, currentStatus: boolean) {
    await checkAdmin();

    try {
        const user = await prisma.user.findUnique({
             where: { id: userId }, 
             select: { isBanned: true } 
        });
        if (!user) return { success: false, error: 'User not found' };

        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: !user.isBanned },
        });

        revalidatePath("/admin");
        revalidatePath("/search");

        return { success: true };
    } catch (error) {
        console.error("Error toggling user ban:", error);
        return { success: false, error: "Failed to toggle user ban status" };
    }
}

export async function deleteService(serviceId: number) {
    await checkAdmin();

    try {
        await prisma.service.delete({
            where: { id: serviceId },
        });

        revalidatePath("/admin");
        revalidatePath("/search");

        return { success: true };
    } catch (error) {
        console.error("Error deleting service:", error);
        return { success: false, error: "Failed to delete service" };
    }
}

export async function getUserBookings(userId: string) {
    await checkAdmin();

    try {
        const bookings = await prisma.booking.findMany({
            where: {
                OR: [
                    { user_id: userId },
                    { profile: { user_id: userId } }
                ]
            },
            include: {
                service: true,
                user: true,
                profile: {
                    include: { user: true }
                }
            },
            orderBy: { date: "desc" }
        });

        return bookings;
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        throw new Error("Failed to fetch user bookings");
    }
}

export async function migrateOrphanedProviders() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен');
    }

    const orphanedProfiles = await prisma.profile.findMany({
        where: { user_id: null },
    });

    let migratedCount = 0;

    for (const profile of orphanedProfiles) {
        // Create a new User
        const newUser = await prisma.user.create({
            data: {
                name: profile.name,
                email: `provider_${profile.id}@example.com`,
                role: 'USER',
                providerType: profile.provider_type,
            },
        });

        // Link the profile to the new user
        await prisma.profile.update({
            where: { id: profile.id },
            data: { user_id: newUser.id },
        });

        migratedCount++;
    }

    revalidatePath('/admin');
    return { success: true, count: migratedCount };
}

export async function checkSystemHealth() {
    await checkAdmin();

    try {
        const start = performance.now();
        // A simple query to check if the database is responsive
        await prisma.$queryRaw`SELECT 1`;
        const end = performance.now();

        const ping = Math.round(end - start);
        return { status: 'ok', ping };
    } catch (error) {
        console.error("Database health check failed:", error);
        return { status: 'error', ping: 0 };
    }
}
