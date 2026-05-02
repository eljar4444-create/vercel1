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
import { getLocale, getTranslations } from 'next-intl/server';
import { resolveLocale } from '@/i18n/canonical';
import { safeParseWithLocale } from '@/i18n/zod';

const StatusSchema = z.nativeEnum(BookingStatus);

export async function updateBookingStatus(
    bookingId: number,
    newStatus: string,
    actorHint?: BookingActor,
) {
    const locale = resolveLocale(await getLocale());
    const t = await getTranslations({ locale, namespace: 'forms.api' });

    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { success: false, error: t('banned') };
    }

    const parsed = await safeParseWithLocale(StatusSchema, newStatus, locale);
    if (!parsed.success) {
        return { success: false, error: t('invalidStatus') };
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
                error: t('invalidStatusTransition', { from: booking.status, to: targetStatus }),
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
        return { success: false, error: error.message || t('statusUpdateError') };
    }
}
