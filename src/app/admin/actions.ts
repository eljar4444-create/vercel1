'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

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

    const profileId = parseProfileId(formData);

    await prisma.profile.update({
        where: { id: profileId },
        data: { is_verified: true },
    });

    revalidatePath('/admin');
    revalidatePath('/search');
}

export async function rejectMaster(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен');
    }

    const profileId = parseProfileId(formData);

    await prisma.$transaction([
        prisma.booking.deleteMany({ where: { profile_id: profileId } }),
        prisma.service.deleteMany({ where: { profile_id: profileId } }),
        prisma.profile.delete({ where: { id: profileId } }),
    ]);

    revalidatePath('/admin');
    revalidatePath('/search');
}

export async function checkAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
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
        ] = await Promise.all([
            prisma.user.count(),
            prisma.service.count(),
            prisma.profile.count(),
            prisma.booking.count(),
            prisma.booking.count({ where: { status: "completed" } }),
            prisma.booking.count({ where: { status: "canceled" } }),
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: {
                            bookings: true, // Bookings as a client
                        }
                    },
                    profile: {
                        include: {
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
                include: {
                    profile: {
                        include: { user: true }
                    },
                },
                orderBy: { id: "desc" },
            }),
            prisma.profile.count(),
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
        };
    } catch (error) {
        console.error("PRISMA FETCH ERROR:", error);
        throw new Error(error instanceof Error ? error.message : "Ошибка базы данных");
    }
}

export async function toggleUserBan(userId: string, currentStatus: boolean) {
    await checkAdmin();

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: !currentStatus },
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
