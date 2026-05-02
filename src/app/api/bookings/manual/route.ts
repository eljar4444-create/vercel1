import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { BookingStatus } from '@prisma/client';
import { upsertClientOnBookingCreated } from '@/lib/client/upsert';
import { localeFromRequest, safeParseWithLocale } from '@/i18n/zod';
import { getTranslations } from 'next-intl/server';

const ManualBookingSchema = z.object({
    profileId: z.number().int().positive(),
    serviceId: z.number().int().positive(),
    staffId: z.string().min(1).optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    clientName: z.string().trim().min(1).max(120),
    clientPhone: z.string().trim().min(3).max(40),
    note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: Request) {
    const locale = localeFromRequest(request);
    const t = await getTranslations({ locale, namespace: 'forms.api' });

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.isBanned) {
        return NextResponse.json({ error: t('banned') }, { status: 403 });
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: t('invalidJson') }, { status: 400 });
    }

    const parsed = await safeParseWithLocale(ManualBookingSchema, payload, locale);
    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? t('invalidData');
        return NextResponse.json({ error: msg }, { status: 400 });
    }
    const input = parsed.data;

    const profile = await prisma.profile.findUnique({
        where: { id: input.profileId },
        select: { id: true, user_id: true },
    });
    if (!profile) {
        return NextResponse.json({ error: t('profileNotFound') }, { status: 404 });
    }

    const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    if (!ownsByUserId && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = await prisma.service.findUnique({
        where: { id: input.serviceId },
        select: { id: true, profile_id: true },
    });
    if (!service || service.profile_id !== profile.id) {
        return NextResponse.json({ error: t('serviceNotFound') }, { status: 404 });
    }

    if (input.staffId) {
        const staff = await prisma.staff.findUnique({
            where: { id: input.staffId },
            select: { profileId: true },
        });
        if (!staff || staff.profileId !== profile.id) {
            return NextResponse.json({ error: t('staffNotFound') }, { status: 404 });
        }
    }

    const dateObj = new Date(`${input.date}T00:00:00.000Z`);
    if (Number.isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: t('invalidDate') }, { status: 400 });
    }

    const conflict = await prisma.booking.findFirst({
        where: {
            profile_id: profile.id,
            date: dateObj,
            time: input.time,
            staff_id: input.staffId ?? null,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        },
        select: { id: true },
    });
    if (conflict) {
        return NextResponse.json(
            { error: t('slotTaken') },
            { status: 409 },
        );
    }

    try {
        const booking = await prisma.$transaction(async (tx) => {
            const b = await tx.booking.create({
                data: {
                    profile_id: profile.id,
                    service_id: input.serviceId,
                    staff_id: input.staffId ?? null,
                    user_id: null,
                    date: dateObj,
                    time: input.time,
                    user_name: input.clientName,
                    user_phone: input.clientPhone,
                    status: BookingStatus.CONFIRMED,
                    isManual: true,
                },
                select: { id: true },
            });

            await upsertClientOnBookingCreated(tx, {
                profileId: profile.id,
                name: input.clientName,
                phone: input.clientPhone,
            });

            return b;
        });

        return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201 });
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: t('slotTaken') }, { status: 409 });
        }
        console.error('manual booking create error:', error);
        return NextResponse.json({ error: t('serverError') }, { status: 500 });
    }
}
