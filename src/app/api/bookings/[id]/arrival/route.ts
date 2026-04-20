import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
    _request: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = parseInt(params.id, 10);
    if (Number.isNaN(bookingId)) {
        return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            user_id: true,
            status: true,
            profile: {
                select: {
                    provider_type: true,
                    arrivalInfo: true,
                },
            },
        },
    });

    if (!booking) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Three-gate check: client owns booking, booking confirmed, provider is not a Salon.
    if (booking.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.status !== 'CONFIRMED') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.profile.provider_type === 'SALON') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ arrivalInfo: booking.profile.arrivalInfo ?? null });
}
