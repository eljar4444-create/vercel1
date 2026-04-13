import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPublicProfileFilters } from '@/lib/publicQueryFilters';

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 200;

type PhotoDTO = {
    id: string;
    url: string;
    serviceId: number | null;
    staffId: string | null;
    position: number;
};

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const { searchParams } = new URL(request.url);
    const serviceIdRaw = searchParams.get('serviceId');
    const staffIdRaw = searchParams.get('staffId');
    const limitRaw = searchParams.get('limit');

    let limit = DEFAULT_LIMIT;
    if (limitRaw !== null) {
        const parsed = parseInt(limitRaw, 10);
        if (Number.isNaN(parsed) || parsed <= 0) {
            return NextResponse.json({ error: 'Invalid limit' }, { status: 400 });
        }
        limit = Math.min(parsed, MAX_LIMIT);
    }

    const profile = await prisma.profile.findFirst({
        where: {
            AND: [{ slug: params.slug }, ...getPublicProfileFilters()],
        },
        select: { id: true },
    });
    if (!profile) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (serviceIdRaw !== null) {
        const serviceId = parseInt(serviceIdRaw, 10);
        if (Number.isNaN(serviceId)) {
            return NextResponse.json({ error: 'Invalid serviceId' }, { status: 400 });
        }
        const photos = await prisma.portfolioPhoto.findMany({
            where: { profileId: profile.id, serviceId },
            orderBy: { position: 'asc' },
            select: { id: true, url: true, serviceId: true, staffId: true, position: true },
        });
        return NextResponse.json({ photos: photos as PhotoDTO[] });
    }

    if (staffIdRaw !== null) {
        const staff = await prisma.staff.findFirst({
            where: { id: staffIdRaw, profileId: profile.id },
            select: { id: true },
        });
        if (!staff) {
            return NextResponse.json({ error: 'Staff not found on profile' }, { status: 404 });
        }
        const photos = await prisma.portfolioPhoto.findMany({
            where: { profileId: profile.id, staffId: staffIdRaw },
            orderBy: { position: 'asc' },
            select: { id: true, url: true, serviceId: true, staffId: true, position: true },
        });
        return NextResponse.json({ photos: photos as PhotoDTO[] });
    }

    // Craft Wall: all photos for the profile, random order (server-side via RANDOM()).
    // Cursor pagination deferred — at current scale (≤200 photos per profile)
    // a single query returns the visible set.
    const photos = await prisma.$queryRaw<PhotoDTO[]>`
        SELECT id, url, "serviceId", "staffId", position
        FROM "PortfolioPhoto"
        WHERE "profileId" = ${profile.id}
        ORDER BY RANDOM()
        LIMIT ${limit}
    `;

    return NextResponse.json({ photos, nextCursor: null });
}
