'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { z } from 'zod';
import { BookingStatus, BookingCanceledBy } from '@prisma/client';
import {
    canTransition,
    actorToCanceledBy,
    type BookingActor,
} from '@/lib/booking/state-machine';
import { recordClientVisit, recordClientNoShow } from '@/lib/client/upsert';

const StatusSchema = z.nativeEnum(BookingStatus);

export async function updateBookingStatus(
    bookingId: number,
    newStatus: string,
    actorHint?: BookingActor,
) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    const parsed = StatusSchema.safeParse(newStatus);
    if (!parsed.success) {
        return { success: false, error: 'Недопустимый статус' };
    }
    const targetStatus = parsed.data;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                profile_id: true,
                user_id: true,
                user_phone: true,
                date: true,
                status: true,
                service: { select: { price: true } },
                profile: {
                    select: {
                        user_id: true,
                    },
                },
            },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        const isMaster = Boolean(booking.profile.user_id && booking.profile.user_id === session.user.id);
        const isClient = Boolean(booking.user_id && booking.user_id === session.user.id);
        const isAdmin = session.user.role === 'ADMIN';

        if (!isMaster && !isClient && !isAdmin) {
            return { success: false, error: 'Forbidden' };
        }

        const actor: BookingActor = actorHint
            ?? (isMaster || isAdmin ? 'MASTER' : 'CLIENT');

        if (!canTransition(booking.status, targetStatus, actor)) {
            return {
                success: false,
                error: `Недопустимый переход: ${booking.status} → ${targetStatus}`,
            };
        }

        const data: { status: BookingStatus; canceledBy?: BookingCanceledBy | null } = {
            status: targetStatus,
        };
        if (targetStatus === BookingStatus.CANCELED) {
            data.canceledBy = actorToCanceledBy(actor);
        }

        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: bookingId },
                data,
            });

            if (targetStatus === BookingStatus.COMPLETED) {
                await recordClientVisit(tx, {
                    profileId: booking.profile_id,
                    phone: booking.user_phone,
                    amount: booking.service?.price ?? 0,
                    visitDate: booking.date,
                });
            } else if (targetStatus === BookingStatus.NO_SHOW) {
                await recordClientNoShow(tx, {
                    profileId: booking.profile_id,
                    phone: booking.user_phone,
                });
            }
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath('/provider/dashboard', 'layout');

        return { success: true };
    } catch (error: any) {
        console.error('Update booking status error:', error);
        return { success: false, error: error.message || 'Ошибка при обновлении статуса' };
    }
}
