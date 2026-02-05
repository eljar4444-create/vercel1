'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MapPickerClient = dynamic(
    () => import('./MapPickerClient'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }
);

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number | null;
    initialLng?: number | null;
    radius?: number; // km
}

export function MapPicker(props: MapPickerProps) {
    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden relative z-0">
            <MapPickerClient {...props} />
        </div>
    );
}
