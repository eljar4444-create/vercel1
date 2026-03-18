import { NextRequest, NextResponse } from 'next/server';

type NominatimCityEntry = {
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
    };
};

function extractCityName(entry: NominatimCityEntry) {
    return (
        entry.address?.city ||
        entry.address?.town ||
        entry.address?.village ||
        entry.address?.municipality ||
        null
    );
}

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';

    if (query.length < 2) {
        return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', query);
    url.searchParams.set('featuretype', 'settlement');
    url.searchParams.set('countrycodes', 'de');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '6');
    url.searchParams.set('dedupe', '1');

    try {
        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.7',
                'User-Agent': 'svoi.de/1.0 (contact@svoi.de)',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'nominatim-unavailable', results: [] },
                { status: 502, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const payload = (await response.json()) as NominatimCityEntry[];
        const unique = new Set<string>();
        const results = Array.isArray(payload)
            ? payload
                .map((entry) => {
                    const cityName = extractCityName(entry);
                    const lat = Number(entry.lat);
                    const lon = Number(entry.lon);

                    if (!cityName || !entry.display_name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
                        return null;
                    }

                    const key = cityName.toLowerCase();
                    if (unique.has(key)) {
                        return null;
                    }
                    unique.add(key);

                    return {
                        name: cityName,
                        displayName: entry.display_name.replace(/,\s*(Deutschland|Germany)\s*$/i, '').trim(),
                        lat,
                        lon,
                    };
                })
                .filter((entry): entry is { name: string; displayName: string; lat: number; lon: number } => Boolean(entry))
            : [];

        return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('[city-search] Nominatim request failed:', error);
        return NextResponse.json(
            { error: 'nominatim-failed', results: [] },
            { status: 502, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
