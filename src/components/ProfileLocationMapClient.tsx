'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface ProfileLocationMapClientProps {
    lat: number;
    lng: number;
    title: string;
    address: string;
}

export default function ProfileLocationMapClient({ lat, lng, title, address }: ProfileLocationMapClientProps) {
    return (
        <MapContainer center={[lat, lng]} zoom={14} className="h-full w-full z-0">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[lat, lng]}>
                <Popup>
                    <div className="space-y-1">
                        <p className="font-semibold">{title}</p>
                        <p className="text-xs text-slate-600">{address}</p>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
