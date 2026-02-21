'use client';

import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
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
}

interface SearchResultsMapClientProps {
    markers: SearchMapMarker[];
}

const DEFAULT_CENTER: [number, number] = [52.52, 13.405];
const customPinIcon = divIcon({
    className: 'search-map-pin-icon',
    html: '<span class="search-map-pin"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

export function SearchResultsMapClient({ markers }: SearchResultsMapClientProps) {
    const center: [number, number] =
        markers.length > 0 ? [markers[0].lat, markers[0].lng] : DEFAULT_CENTER;

    return (
        <MapContainer center={center} zoom={11} className="h-full w-full z-0">
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {markers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customPinIcon}>
                    <Popup>
                        <div className="space-y-1">
                            <p className="font-semibold text-slate-900">{marker.name}</p>
                            <p className="text-xs text-slate-600">
                                {[marker.address, marker.city].filter(Boolean).join(', ')}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
