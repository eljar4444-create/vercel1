import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findFirst({
        where: { user_id: session.user.id },
        select: { id: true },
    });

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            rating: true,
            comment: true,
            replyText: true,
            repliedAt: true,
            createdAt: true,
            client: { select: { name: true, image: true } },
            booking: {
                select: {
                    id: true,
                    date: true,
                    service: { select: { title: true } },
                },
            },
        },
    });

    const count = reviews.length;
    const average =
        count > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
            : 0;

    return NextResponse.json({
        average: Math.round(average * 10) / 10,
        count,
        reviews: reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            replyText: r.replyText,
            repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
            createdAt: r.createdAt.toISOString(),
            clientName: r.client?.name ?? 'Клиент',
            clientImage: r.client?.image ?? null,
            serviceTitle: r.booking?.service?.title ?? null,
            bookingDate: r.booking?.date ? r.booking.date.toISOString() : null,
        })),
    });
}
