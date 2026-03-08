'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { divIcon } from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, FeatureGroup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import { SearchMapMarker } from './SearchResultsMap';

interface SearchResultsMapClientProps {
    markers: SearchMapMarker[];
    hoveredMarkerId?: number | null;
}

const DEFAULT_CENTER: [number, number] = [52.52, 13.405];

function MapUpdater() {
    const map = useMap();
    const searchParams = useSearchParams();

    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const cityStr = searchParams.get('city');

    useEffect(() => {
        // Only fly to coordinates if there is an explicit city in the URL.
        // If 'city' is null, it means the user manually dragged the map,
        // or we are in a coordinate-only mode, so we shouldn't force map centering.
        if (cityStr && latStr && lngStr) {
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.flyTo([lat, lng], 13, { duration: 1.5 });
            }
        }
    }, [map, latStr, lngStr, cityStr]);

    return null;
}

function MapEventListener() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useMapEvents({
        dragend: (e) => {
            const map = e.target;
            const center = map.getCenter();
            const params = new URLSearchParams(searchParams.toString());

            const oldLat = params.get('lat');
            const oldLng = params.get('lng');

            const newLat = center.lat.toFixed(6);
            const newLng = center.lng.toFixed(6);

            // only update if coordinates actually changed
            if (oldLat !== newLat || oldLng !== newLng) {
                params.set('lat', newLat);
                params.set('lng', newLng);
                params.delete('city'); // Unbind city since user dragged manually
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        },
        // Optionally listen to zoomend if we want zoom to also trigger a re-fetch
        zoomend: (e) => {
            const map = e.target;
            const center = map.getCenter();
            const params = new URLSearchParams(searchParams.toString());

            params.set('lat', center.lat.toFixed(6));
            params.set('lng', center.lng.toFixed(6));
            params.delete('city');
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    });

    return null;
}

function SearchRadiusCircle() {
    const searchParams = useSearchParams();
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lngStr) return null;

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radiusKm = radiusStr ? parseInt(radiusStr, 10) : 10; // Default to 10km if missing

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm) || radiusKm <= 0) return null;

    return (
        <Circle
            center={[lat, lng]}
            radius={radiusKm * 1000} // Leaflet uses meters
            pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '8, 8'
            }}
        />
    );
}

export function SearchResultsMapClient({ markers, hoveredMarkerId }: SearchResultsMapClientProps) {
    const router = useRouter();
    console.log('[SearchResultsMapClient] Incoming Markers:', markers);

    // Filter out markers with invalid coordinates and add jitter to exact duplicates
    const seenCoords = new Set<string>();
    const validMarkers = markers
        .filter(m => typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng) && (m.lat !== 0 || m.lng !== 0))
        .map(m => {
            let lat = m.lat;
            let lng = m.lng;
            let key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            while (seenCoords.has(key)) {
                // Add a small ~20-50m random offset to prevent exact marker stacking
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

    const center: [number, number] =
        validMarkers.length > 0 ? [validMarkers[0].lat, validMarkers[0].lng] : DEFAULT_CENTER;

    return (
        <MapContainer center={center} zoom={11} className="h-full w-full z-0">
            <MapUpdater />
            <MapEventListener />
            <SearchRadiusCircle />
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {validMarkers.map((marker) => {
                const isHovered = marker.id === hoveredMarkerId;
                const firstLetter = marker.name ? marker.name.charAt(0).toUpperCase() : 'M';

                // Programmatic hover states triggered from list sidebar
                const activeDotScale = isHovered ? 'scale-110' : '';
                const activeTooltipClass = isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

                // Avatar image or fallback letter
                const avatarHtml = marker.image
                    ? `<img src="${marker.image}" class="w-full h-full object-cover" alt="avatar" />`
                    : marker.name ? marker.name.charAt(0).toUpperCase() : 'M';

                // If exact, show the black dot. Else, show an invisible anchor (w-12 h-12 to make hovering the circle center easy).
                const dotHtml = marker.isExactLocation
                    ? `<div class="w-4 h-4 bg-slate-900 rounded-full shadow-md border-2 border-white transition-transform duration-200 group-hover:scale-110 relative z-10 ${activeDotScale}"></div>`
                    : `<div class="w-12 h-12 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"></div>`; // invisible target

                const iconHtml = `
                    <div class="group relative cursor-pointer flex items-center justify-center">
                        ${dotHtml}
                        
                        <!-- Invisible bridge (pb-3) to prevent hover dropout -->
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

                // Empty className removes Leaflet's default white square
                const dynamicIcon = divIcon({
                    className: 'bg-transparent border-none',
                    html: iconHtml,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10], // Center of the 20x20 (w-5 h-5) pin
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
}
