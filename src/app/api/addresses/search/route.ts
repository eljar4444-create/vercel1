import { NextRequest, NextResponse } from 'next/server';
import { findGermanCitySelection } from '@/lib/german-city-options';

type PhotonFeature = {
    geometry?: {
        coordinates?: [number, number];
    };
    properties?: {
        name?: string;
        street?: string;
        city?: string;
        postcode?: string;
        country?: string;
        countrycode?: string;
    };
};

function formatStreetName(feature: PhotonFeature) {
    return feature.properties?.name?.trim() || feature.properties?.street?.trim() || '';
}

export async function GET(request: NextRequest) {
    const streetQuery = request.nextUrl.searchParams.get('q')?.trim() || '';
    const cityInput = request.nextUrl.searchParams.get('city')?.trim() || '';

    if (streetQuery.length < 3 || !cityInput) {
        return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    try {
        const citySelection = findGermanCitySelection(cityInput);
        const germanCityName = citySelection?.germanName || cityInput;
        const queryForApi = encodeURIComponent(`${streetQuery} ${germanCityName}, Deutschland`);
        const latBias = citySelection?.lat != null ? `&lat=${citySelection.lat}` : '';
        const lonBias = citySelection?.lng != null ? `&lon=${citySelection.lng}` : '';
        const url = `https://photon.komoot.io/api/?q=${queryForApi}&osm_tag=highway&limit=15${latBias}${lonBias}`;

        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'svoi.de/1.0 (contact@svoi.de)',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('[address-search] Photon returned status', response.status, 'for', url);
            throw new Error(`photon-http-${response.status}`);
        }

        const payload = (await response.json()) as { features?: PhotonFeature[] };
        const seenStreetNames = new Set<string>();
        const results = Array.isArray(payload.features)
            ? payload.features
                .map((feature) => {
                    const countryCode = feature.properties?.countrycode?.trim().toLowerCase();
                    const streetName = formatStreetName(feature);
                    const coordinates = feature.geometry?.coordinates;
                    const lon = Array.isArray(coordinates) ? Number(coordinates[0]) : Number.NaN;
                    const lat = Array.isArray(coordinates) ? Number(coordinates[1]) : Number.NaN;

                    if (countryCode !== 'de' || !streetName || !Number.isFinite(lat) || !Number.isFinite(lon)) {
                        return null;
                    }

                    const uniqueKey = streetName.toLowerCase();
                    if (seenStreetNames.has(uniqueKey)) {
                        return null;
                    }

                    seenStreetNames.add(uniqueKey);

                    return {
                        displayName: feature.properties?.postcode?.trim()
                            ? `${streetName}, ${feature.properties.postcode.trim()}`
                            : streetName,
                        streetName,
                        lat,
                        lon,
                        city: feature.properties?.city?.trim() || germanCityName,
                        postcode: feature.properties?.postcode?.trim() || null,
                    };
                })
                .filter((entry): entry is {
                    displayName: string;
                    streetName: string;
                    lat: number;
                    lon: number;
                    city: string;
                    postcode: string | null;
                } => Boolean(entry))
            : [];

        return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('[address-search] Photon request failed:', error, { query: streetQuery, city: cityInput });
        return NextResponse.json(
            { error: 'photon-failed', results: [] },
            { status: 502, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
