import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import type { Prisma } from '@prisma/client';

const SORT_WHITELIST = new Set([
    'lastVisit',
    'totalSpent',
    'totalBookings',
    'noShows',
    'name',
]);

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get('q') ?? '').trim();
    const sortBy = url.searchParams.get('sortBy') ?? 'lastVisit';
    const sortDir = url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const sortField = SORT_WHITELIST.has(sortBy) ? sortBy : 'lastVisit';

    const profile = await prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: session.user.id },
                ...(session.user.email ? [{ user_email: session.user.email }] : []),
            ],
        },
        select: { id: true },
    });

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const where: Prisma.ClientWhereInput = { profileId: profile.id };
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    const orderBy: Prisma.ClientOrderByWithRelationInput =
        sortField === 'lastVisit'
            ? { lastVisit: { sort: sortDir, nulls: 'last' } }
            : ({ [sortField]: sortDir } as Prisma.ClientOrderByWithRelationInput);

    const clients = await prisma.client.findMany({
        where,
        orderBy,
        take: 200,
    });

    return NextResponse.json({
        clients: clients.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            totalBookings: c.totalBookings,
            totalSpent: Number(c.totalSpent),
            noShows: c.noShows,
            lastVisit: c.lastVisit ? c.lastVisit.toISOString() : null,
        })),
    });
}
