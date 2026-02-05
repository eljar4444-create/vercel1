'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

// Component to handle map clicks
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e: LeafletMouseEvent) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Component to re-center map when props change
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

interface MapPickerClientProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number | null;
    initialLng?: number | null;
    radius?: number; // km
}

export default function MapPickerClient({ onLocationSelect, initialLat, initialLng, radius = 10 }: MapPickerClientProps) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    // Default to Berlin if no position
    const defaultCenter: [number, number] = [52.5200, 13.4050];

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition([initialLat, initialLng]);
        }
    }, [initialLat, initialLng]);

    const handleMapClick = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
    };

    const mapCenter = position || defaultCenter;

    return (
        <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {position && (
                <Marker position={position} />
            )}

            {position && radius && (
                <Circle
                    center={position}
                    pathOptions={{ fillColor: '#4285F4', fillOpacity: 0.2, color: '#4285F4' }}
                    radius={radius * 1000}
                />
            )}

            <MapEvents onLocationSelect={handleMapClick} />
            <ChangeView center={mapCenter} />
        </MapContainer>
    );
}
