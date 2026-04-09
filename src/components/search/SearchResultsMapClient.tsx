'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useId } from 'react';

import { divIcon } from 'leaflet';
import { Circle, MapContainer, Marker, TileLayer, useMap, FeatureGroup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import type { SearchMapMarker } from './SearchResultsMap';
import type { MapBounds } from './types';
import { radiusToBounds } from './types';

interface SearchResultsMapClientProps {
    markers: SearchMapMarker[];
    hoveredMarkerId?: number | null;
    onBoundsChange?: (bounds: MapBounds) => void;
    initialCenter?: [number, number];
    initialZoom?: number;
    radiusKm?: number;
}

const DEFAULT_CENTER: [number, number] = [52.52, 13.405];

/** Syncs the map view when explicit coordinates are provided (e.g. city search). */
function MapUpdater({ initialCenter, initialZoom, radiusKm }: { initialCenter?: [number, number]; initialZoom: number; radiusKm?: number }) {
    const map = useMap();
    const searchParams = useSearchParams();
    const urlRadiusStr = searchParams.get('radius');
    const urlRadius = urlRadiusStr ? parseFloat(urlRadiusStr) : radiusKm;

    const didFly = useRef(false);
    const prevRadius = useRef<number | undefined>(urlRadius);
    const prevCenter = useRef<string | undefined>(initialCenter?.join(','));

    // We only ever fly if the city (initialCenter) or the radius explicitly changed in the URL params.
    // We NEVER fly just because the map moved, or because markers changed. The map is "dumb" and listens only to explicit filter changes.
    useEffect(() => {
        try {
            if (!initialCenter) return;

            const currentCenterStr = initialCenter.join(',');
            const radiusChanged = prevRadius.current !== urlRadius;
            const centerChanged = prevCenter.current !== currentCenterStr;

            if (radiusChanged || centerChanged || !didFly.current) {
                didFly.current = true;
                prevRadius.current = urlRadius;
                prevCenter.current = currentCenterStr;

                (map as any)._isProgrammaticMove = true;

                if (urlRadius) {
                    const { southWest, northEast } = radiusToBounds(initialCenter, urlRadius);
                    map.flyToBounds([southWest, northEast], {
                        padding: [20, 20],
                        duration: 1.5,
                        maxZoom: 16,
                    });
                } else {
                    map.flyTo(initialCenter, initialZoom, { duration: 1.5 });
                }

                map.once('moveend', () => {
                    setTimeout(() => { (map as any)._isProgrammaticMove = false; }, 100);
                });
            }
        } catch (e) {
            console.error('[MapUpdater] flyTo error:', e);
        }
    }, [map, initialCenter, initialZoom, urlRadius]);

    return null;
}

/** Emits bounding box on every map move/zoom via onBoundsChange callback. */
function MapBoundsEmitter({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
    const map = useMap();
    const isMapMounted = useRef(false);

    useMapEvents({
        moveend: () => {
            try {
                if (!onBoundsChange) return;

                if (!isMapMounted.current) {
                    isMapMounted.current = true;
                    return; // Ignore the very first spurious event triggered by map initialization
                }

                const b = map.getBounds();
                onBoundsChange({
                    minLat: b.getSouthWest().lat,
                    maxLat: b.getNorthEast().lat,
                    minLng: b.getSouthWest().lng,
                    maxLng: b.getNorthEast().lng,
                    source: (map as any)._isProgrammaticMove ? 'programmatic' : 'user',
                });
            } catch (e) {
                console.error('[MapBoundsEmitter] getBounds error:', e);
            }
        },
    });

    return null;
}

/** Unbinds custom event listeners on unmount (React 18 Strict Mode safe).
 *  We intentionally do NOT call map.remove() here — react-leaflet handles
 *  DOM cleanup itself, and calling remove() causes "Map container is being
 *  reused by another instance" errors on Strict Mode remounts. */
function MapCleanup() {
    const map = useMap();
    useEffect(() => {
        return () => {
            try {
                map.off();
            } catch {
                // Already cleaned up — safe to ignore
            }
        };
    }, [map]);
    return null;
}

export function SearchResultsMapClient({
    markers,
    hoveredMarkerId,
    onBoundsChange,
    initialCenter,
    initialZoom,
}: SearchResultsMapClientProps) {
    const router = useRouter();
    const zoom = initialZoom ?? 11;
    // Unique key per component instance — forces a fresh DOM container on Strict Mode remount
    const mapKey = useId();
    const [mapError, setMapError] = useState(false);

    // Filter out markers with invalid coordinates and add jitter to exact duplicates
    const seenCoords = new Set<string>();
    const validMarkers = markers
        .filter(m => typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng) && (m.lat !== 0 || m.lng !== 0))
        .map(m => {
            let lat = m.lat;
            let lng = m.lng;
            let key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            while (seenCoords.has(key)) {
                lat += (Math.random() - 0.5) * 0.0005;
                lng += (Math.random() - 0.5) * 0.0005;
                key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            }
            seenCoords.add(key);
            return {
                ...m,
                lat,
                lng,
                isExactLocation: m.provider_type === 'SALON'
            };
        });

    const center: [number, number] = initialCenter
        ? initialCenter
        : validMarkers.length > 0
            ? [validMarkers[0].lat, validMarkers[0].lng]
            : DEFAULT_CENTER;

    if (mapError) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-400 text-sm">
                Карта временно недоступна
            </div>
        );
    }

    try {
        return (
            <MapContainer key={mapKey} center={center} zoom={zoom} className="h-full w-full z-0">
                <MapCleanup />
                <MapUpdater initialCenter={initialCenter} initialZoom={zoom} />
                <MapBoundsEmitter onBoundsChange={onBoundsChange} />
                <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {validMarkers.map((marker) => {
                const isHovered = marker.id === hoveredMarkerId;
                const firstLetter = marker.name ? marker.name.charAt(0).toUpperCase() : 'M';

                const activeDotScale = isHovered ? 'scale-110' : '';
                const activeTooltipClass = isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

                const avatarHtml = marker.image
                    ? `<img src="${marker.image}" class="w-full h-full object-cover" alt="avatar" />`
                    : marker.name ? marker.name.charAt(0).toUpperCase() : 'M';

                const dotHtml = marker.isExactLocation
                    ? `<div class="w-4 h-4 bg-slate-900 rounded-full shadow-md border-2 border-white transition-transform duration-200 group-hover:scale-110 relative z-10 ${activeDotScale}"></div>`
                    : `<div class="w-12 h-12 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"></div>`;

                const iconHtml = `
                    <div class="group relative cursor-pointer flex items-center justify-center">
                        ${dotHtml}
                        
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 transition-opacity duration-200 z-50 group-hover:opacity-100 group-hover:pointer-events-auto ${activeTooltipClass}">
                            
                            <div class="w-52 bg-white rounded-2xl shadow-xl p-4 flex flex-col items-center text-center border border-slate-100 antialiased transform-gpu">
                                
                                <div class="w-14 h-14 bg-slate-50 rounded-full mb-3 flex items-center justify-center text-slate-600 font-bold text-lg overflow-hidden border border-slate-200">
                                    ${avatarHtml}
                                </div>
                                
                                <p class="text-base font-bold text-slate-900 truncate w-full">${marker.name}</p>
                                <div class="flex items-center justify-center text-xs font-medium text-slate-500 mt-1 mb-4">
                                    <span class="text-amber-400 mr-1">★</span> 5.0 <span class="text-slate-400 ml-1">(120+)</span>
                                </div>
                                
                                <div class="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
                                    Перейти в профиль
                                </div>
                            </div>
                            
                        </div>
                    </div>
                `;

                const dynamicIcon = divIcon({
                    className: 'bg-transparent border-none',
                    html: iconHtml,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                });

                return (
                    <FeatureGroup key={marker.id}>
                        {!marker.isExactLocation && (
                            <Circle
                                center={[marker.lat, marker.lng]}
                                radius={500}
                                pathOptions={{ fillColor: '#0f172a', fillOpacity: 0.15, color: '#0f172a', weight: 1 }}
                                eventHandlers={{
                                    click: () => {
                                        router.push(`/salon/${marker.slug}`);
                                    }
                                }}
                            />
                        )}
                        <Marker
                            position={[marker.lat, marker.lng]}
                            icon={dynamicIcon}
                            zIndexOffset={isHovered ? 1000 : 0}
                            eventHandlers={{
                                click: () => {
                                    router.push(`/salon/${marker.slug}`);
                                }
                            }}
                        />
                    </FeatureGroup>
                );
            })}
        </MapContainer>
        );
    } catch (e) {
        console.error('[SearchResultsMapClient] Render error:', e);
        if (!mapError) setMapError(true);
        return (
            <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-400 text-sm">
                Карта временно недоступна
            </div>
        );
    }
}
