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
    const sortParam = searchParams.get('sort') || undefined;
    const language = searchParams.get('language') || undefined;
    const todayFilter = searchParams.get('today') === 'true';
    const homeVisitFilter = searchParams.get('homeVisit') === 'true';
    const promoFilter = searchParams.get('promo') === 'true';
    const inSalonFilter = searchParams.get('inSalon') === 'true';
    const cardPaymentFilter = searchParams.get('cardPayment') === 'true';
    const instantBookingFilter = searchParams.get('instantBooking') === 'true';

    if ([minLat, maxLat, minLng, maxLng].some(isNaN)) {
        return NextResponse.json(
            { error: 'Missing or invalid bounding box params (minLat, maxLat, minLng, maxLng)' },
            { status: 400 }
        );
    }

    const andConditions: any[] = [
        { status: 'PUBLISHED' },
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

    if (language) {
        andConditions.push({ languages: { has: language } });
    }

    if (homeVisitFilter) {
        andConditions.push({
            attributes: {
                path: ['homeVisit'],
                equals: true,
            },
        });
    }

    if (promoFilter) {
        andConditions.push({
            attributes: {
                path: ['hasPromo'],
                equals: true,
            },
        });
    }

    if (todayFilter) {
        andConditions.push({
            attributes: {
                path: ['availableToday'],
                equals: true,
            },
        });
    }

    if (inSalonFilter) {
        andConditions.push({
            OR: [
                { provider_type: 'SALON' },
                { attributes: { path: ['inSalon'], equals: true } },
            ],
        });
    }

    if (cardPaymentFilter) {
        andConditions.push({
            attributes: {
                path: ['cardPayment'],
                equals: true,
            },
        });
    }

    if (instantBookingFilter) {
        andConditions.push({
            attributes: {
                path: ['instantBooking'],
                equals: true,
            },
        });
    }

    let orderBy: any = { created_at: 'desc' };
    if (sortParam === 'rating') {
        orderBy = { reviews: { _avg: { rating: 'desc' } } };
    }

    try {
        const profiles = await prisma.profile.findMany({
            where: { AND: andConditions },
            include: {
                category: true,
                services: true,
                reviews: true,
            },
            orderBy,
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
