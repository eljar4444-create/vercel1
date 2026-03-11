export interface MapBounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    source?: 'user' | 'programmatic';
}

/**
 * Fallback: maps a search radius (in km) to a Leaflet zoom level.
 * Used only when fitBounds cannot be used (e.g. no center point).
 */
export function calculateMapZoom(radiusKm: number): number {
    if (radiusKm <= 2) return 15;
    if (radiusKm <= 5) return 14;
    if (radiusKm <= 10) return 13;
    if (radiusKm <= 20) return 12;
    if (radiusKm <= 50) return 10.5;
    return 9;
}

/**
 * Calculates a geographic bounding box from a center point and radius in km.
 * 1° lat ≈ 111 km; 1° lng varies with latitude.
 */
export function radiusToBounds(
    center: [number, number],
    radiusKm: number
): { southWest: [number, number]; northEast: [number, number] } {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((center[0] * Math.PI) / 180));
    return {
        southWest: [center[0] - latDelta, center[1] - lngDelta],
        northEast: [center[0] + latDelta, center[1] + lngDelta],
    };
}
