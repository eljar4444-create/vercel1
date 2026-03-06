'use client';

import { useRouter } from 'next/navigation';

import { divIcon } from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface SearchMapMarker {
    id: number;
    name: string;
    city: string;
    address?: string | null;
    lat: number;
    lng: number;
    image?: string | null;
    slug: string;
}

interface SearchResultsMapClientProps {
    markers: SearchMapMarker[];
    hoveredMarkerId?: number | null;
}

const DEFAULT_CENTER: [number, number] = [52.52, 13.405];

export function SearchResultsMapClient({ markers, hoveredMarkerId }: SearchResultsMapClientProps) {
    const router = useRouter();
    const center: [number, number] =
        markers.length > 0 ? [markers[0].lat, markers[0].lng] : DEFAULT_CENTER;

    return (
        <MapContainer center={center} zoom={11} className="h-full w-full z-0">
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {markers.map((marker) => {
                const isHovered = marker.id === hoveredMarkerId;
                const firstLetter = marker.name ? marker.name.charAt(0).toUpperCase() : 'M';

                // Programmatic hover states triggered from list sidebar
                const activeDotScale = isHovered ? 'scale-110' : '';
                const activeTooltipClass = isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

                // Avatar image or fallback letter
                const avatarHtml = marker.image
                    ? `<img src="${marker.image}" class="w-full h-full object-cover" alt="avatar" />`
                    : marker.name ? marker.name.charAt(0).toUpperCase() : 'M';

                const iconHtml = `
                    <div class="group relative cursor-pointer flex items-center justify-center">
                        <div class="w-4 h-4 bg-slate-900 rounded-full shadow-md border-2 border-white transition-transform duration-200 group-hover:scale-110 relative z-10 ${activeDotScale}"></div>
                        
                        <!-- Invisible bridge (pb-3) to prevent hover dropout -->
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 transition-opacity duration-200 z-50 group-hover:opacity-100 group-hover:pointer-events-auto ${activeTooltipClass}">
                            
                            <div class="w-52 bg-white rounded-2xl shadow-xl p-4 flex flex-col items-center text-center border border-slate-100">
                                
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
                    <Marker
                        key={marker.id}
                        position={[marker.lat, marker.lng]}
                        icon={dynamicIcon}
                        zIndexOffset={isHovered ? 1000 : 0}
                        eventHandlers={{
                            click: () => {
                                router.push(`/salon/${marker.slug}`);
                            }
                        }}
                    >
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
