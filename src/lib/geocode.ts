/**
 * Low-level Nominatim fetch helper.
 * Returns { lat, lng } or null if no results.
 */
async function nominatimSearch(query: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'svoi.de/1.0 (contact@svoi.de)',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        console.error('[geocode] Nominatim returned status', response.status);
        throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lng)) {
        console.warn('[geocode] Invalid coordinates from Nominatim:', data[0]);
        return null;
    }

    return { lat, lng };
}

/**
 * Geocode a provider address with cascading fallback:
 *   1. Full address: "Street Number, ZipCode, City, Germany"
 *   2. Fallback:     "ZipCode, City, Germany" (center of city)
 *
 * Returns { lat, lng } or null if BOTH attempts returned no results.
 * Throws on network/HTTP errors so callers can distinguish
 * "address not found" from "API unreachable".
 */
export async function geocodeAddress(
    address: string,
    city: string,
    zipCode: string
): Promise<{ lat: number; lng: number } | null> {
    // Attempt 1 — full address
    const fullQuery = [address, zipCode, city, 'Germany'].filter(Boolean).join(', ');
    console.log('[geocode] Attempt 1 (full):', fullQuery);

    const result = await nominatimSearch(fullQuery);
    if (result) {
        console.log(`[geocode] ✓ Full address resolved: ${result.lat}, ${result.lng}`);
        return result;
    }

    // Attempt 2 — city + zip only (puts provider at city center)
    const fallbackQuery = [zipCode, city, 'Germany'].filter(Boolean).join(', ');
    if (fallbackQuery !== fullQuery) {
        console.log('[geocode] Attempt 2 (fallback):', fallbackQuery);
        const fallback = await nominatimSearch(fallbackQuery);
        if (fallback) {
            console.log(`[geocode] ✓ Fallback resolved: ${fallback.lat}, ${fallback.lng}`);
            return fallback;
        }
    }

    console.warn('[geocode] ✗ Both attempts returned no results');
    return null;
}

/**
 * Geocode a city name (e.g. "Кульмбах" or "Berlin") to coordinates.
 * Used on the search page to get the center point for radius search.
 */
export async function geocodeCity(
    city: string
): Promise<{ lat: number; lng: number } | null> {
    try {
        return await nominatimSearch(`${city}, Germany`);
    } catch {
        return null;
    }
}
