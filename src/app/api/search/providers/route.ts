import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { searchRateLimit } from '@/lib/rate-limit';
import { getBatchedQuickSlots } from '@/app/actions/getQuickSlots';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';
    
    if (ip !== 'unknown') {
        const rateLimit = await searchRateLimit.limit(ip);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Too Many Requests' },
                { 
                    status: 429, 
                    headers: { 'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) }
                }
            );
        }
    }

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
                photos: {
                    where: { serviceId: null, staffId: null },
                    orderBy: { position: 'asc' },
                    select: { url: true },
                    take: 1,
                },
            },
            orderBy,
            take: 50,
        });

        const resolveImageUrl = (profile: any): string | null => {
            const interiorPhoto =
                profile.photos?.[0]?.url?.trim() ||
                profile.studioImages?.find?.((p: any) => typeof p === 'string' && p.trim().length > 0) ||
                profile.gallery?.find?.((p: any) => typeof p === 'string' && p.trim().length > 0) ||
                null;
            const avatarPhoto = profile.image_url?.trim() || null;
            return profile.provider_type === 'SALON'
                ? interiorPhoto
                : avatarPhoto || interiorPhoto;
        };

        const results = profiles.map((profile: any) => ({
            id: profile.id,
            slug: profile.slug,
            name: profile.name,
            provider_type: profile.provider_type,
            city: profile.city,
            address: profile.provider_type === 'SALON' ? profile.address : null,
            image_url: resolveImageUrl(profile),
            latitude: profile.latitude,
            longitude: profile.longitude,
            services: (profile.services || []).map((s: any) => ({
                id: s.id,
                title: s.title,
                price: Number(s.price),
                duration_min: s.duration_min,
            })),
        }));

        const profileIds = results.map((p: any) => p.id);
        const batchedSlots = await getBatchedQuickSlots(profileIds);

        const resultsWithSlots = results.map((p: any) => ({
            ...p,
            prefetchedSlots: batchedSlots[p.id] || null
        }));

        return NextResponse.json({ providers: resultsWithSlots });
    } catch (e: any) {
        console.error('[api/search/providers] DB error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
