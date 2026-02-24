/**
 * Geocode an address using the free Nominatim (OpenStreetMap) API.
 * Returns { lat, lng } or null if the address could not be resolved.
 */
export async function geocodeAddress(
    address: string,
    city: string,
    zipCode: string
): Promise<{ lat: number; lng: number } | null> {
    const query = [address, city, zipCode, 'Germany'].filter(Boolean).join(', ');

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'svoi.de/1.0 (contact@svoi.de)',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            console.error('[geocode] Nominatim returned status', response.status);
            return null;
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('[geocode] No results for query:', query);
            return null;
        }

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        if (isNaN(lat) || isNaN(lng)) {
            console.warn('[geocode] Invalid coordinates from Nominatim:', data[0]);
            return null;
        }

        return { lat, lng };
    } catch (error) {
        console.error('[geocode] Failed to geocode address:', error);
        return null;
    }
}

/**
 * Geocode a city name (e.g. "Кульмбах" or "Berlin") to coordinates.
 * Used on the search page to get the center point for radius search.
 */
export async function geocodeCity(
    city: string
): Promise<{ lat: number; lng: number } | null> {
    const query = `${city}, Germany`;

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'svoi.de/1.0 (contact@svoi.de)',
                Accept: 'application/json',
            },
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng };
    } catch {
        return null;
    }
}
