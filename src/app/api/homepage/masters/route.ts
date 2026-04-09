import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1 deg lat ≈ 111km
// 1 deg lng ≈ 111km * cos(lat)
function getBounds(lat: number, lng: number, radiusKm: number) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
    };
}

// Haversine formula for exact distance
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

export async function GET(req: NextRequest) {
    // We now accept lat/lng/radius for Local Mode, or drop back to city/global search
    const latStr = req.nextUrl.searchParams.get('lat');
    const lngStr = req.nextUrl.searchParams.get('lng');
    const radiusStr = req.nextUrl.searchParams.get('radius') || '100';
    const city = req.nextUrl.searchParams.get('city') || '';

    try {
        let whereClause: any = {
            user: { isBanned: false },
            status: 'PUBLISHED',
            is_verified: true,
        };

        const radiusKm = parseFloat(radiusStr);
        let lat: number | undefined;
        let lng: number | undefined;

        // Apply bounding box optimization if coordinates provided
        if (latStr && lngStr && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(lngStr))) {
            lat = parseFloat(latStr);
            lng = parseFloat(lngStr);
            const { minLat, maxLat, minLng, maxLng } = getBounds(lat, lng, radiusKm);
            
            whereClause.latitude = { not: null, gte: minLat, lte: maxLat };
            whereClause.longitude = { not: null, gte: minLng, lte: maxLng };
        } else if (city) {
            // Strict city fallback 
            whereClause.city = { contains: city, mode: 'insensitive' };
        }

        let masters = await prisma.profile.findMany({
            where: whereClause,
            take: 40, // fetch extra in case bounding box corners need precise trimming
            include: {
                reviews: { select: { rating: true } },
                category: { select: { name: true } },
                user: { select: { image: true } },
                services: { select: { title: true, price: true, duration_min: true }, take: 2 },
            },
            orderBy: { created_at: 'desc' },
        });

        // Exact distance filtering using Haversine if coordinates provided
        if (lat !== undefined && lng !== undefined) {
             masters = masters.filter(m => {
                 if (m.latitude == null || m.longitude == null) return false;
                 return getDistanceKm(lat!, lng!, m.latitude, m.longitude) <= radiusKm;
             }).slice(0, 8); // Cap to 8 masters
        } else {
             masters = masters.slice(0, 8);
        }

        const result = masters.map((master) => {
            const avgRating =
                master.reviews.length > 0
                    ? (master.reviews.reduce((sum, r) => sum + r.rating, 0) / master.reviews.length).toFixed(1)
                    : '5.0';

            const workPhotoUrl =
                master.gallery.find((p) => typeof p === 'string' && p.trim().length > 0) ||
                master.image_url?.trim() ||
                master.user?.image?.trim() ||
                null;

            return {
                id: master.id,
                slug: master.slug,
                name: master.name,
                category: master.category?.name || 'Бьюти-мастер',
                city: master.city,
                isVerified: master.is_verified,
                avgRating,
                workPhotoUrl,
                services: master.services.map((s) => ({
                    title: s.title,
                    price: Number(s.price),
                    durationMin: s.duration_min,
                })),
            };
        });

        return NextResponse.json(result);
    } catch (e) {
        console.error('[API /homepage/masters] DB error:', e);
        return NextResponse.json([], { status: 500 });
    }
}
