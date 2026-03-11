import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const minLat = parseFloat(searchParams.get('minLat') || '');
    const maxLat = parseFloat(searchParams.get('maxLat') || '');
    const minLng = parseFloat(searchParams.get('minLng') || '');
    const maxLng = parseFloat(searchParams.get('maxLng') || '');
    const q = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;

    if ([minLat, maxLat, minLng, maxLng].some(isNaN)) {
        return NextResponse.json(
            { error: 'Missing or invalid bounding box params (minLat, maxLat, minLng, maxLng)' },
            { status: 400 }
        );
    }

    const andConditions: any[] = [
        { is_verified: true },
        { category: { slug: { not: 'health' } } },
        { user: { isBanned: false } },
        {
            latitude: { not: null, gte: minLat, lte: maxLat },
        },
        {
            longitude: { not: null, gte: minLng, lte: maxLng },
        },
    ];

    if (category && category !== 'health') {
        andConditions.push({ category: { slug: category } });
    }

    if (q) {
        andConditions.push({
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { category: { name: { contains: q, mode: 'insensitive' } } },
                {
                    services: {
                        some: {
                            title: { contains: q, mode: 'insensitive' },
                        },
                    },
                },
            ],
        });
    }

    try {
        const profiles = await prisma.profile.findMany({
            where: { AND: andConditions },
            include: {
                category: true,
                services: true,
            },
            orderBy: { created_at: 'desc' },
            take: 50,
        });

        const results = profiles.map((profile: any) => ({
            id: profile.id,
            slug: profile.slug,
            name: profile.name,
            provider_type: profile.provider_type,
            city: profile.city,
            address: profile.provider_type === 'SALON' ? profile.address : null,
            image_url: profile.image_url,
            latitude: profile.latitude,
            longitude: profile.longitude,
            services: (profile.services || []).map((s: any) => ({
                id: s.id,
                title: s.title,
                price: Number(s.price),
                duration_min: s.duration_min,
            })),
        }));

        return NextResponse.json({ providers: results });
    } catch (e: any) {
        console.error('[api/search/providers] DB error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
