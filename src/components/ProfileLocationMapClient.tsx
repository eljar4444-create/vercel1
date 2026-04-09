'use client';

import { useEffect, useRef, useState } from 'react';
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
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Clean any stale leaflet state from the container before mounting
        if (containerRef.current) {
            const existing = containerRef.current.querySelector('.leaflet-container') as HTMLElement & { _leaflet_id?: number };
            if (existing?._leaflet_id) {
                delete existing._leaflet_id;
            }
        }
        setMounted(true);

        return () => {
            setMounted(false);
        };
    }, []);

    if (!mounted) {
        return <div ref={containerRef} className="h-full w-full bg-stone-100 animate-pulse" />;
    }

    return (
        <div ref={containerRef} className="h-full w-full">
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
        </div>
    );
}
