'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { MapBounds } from './types';

export type { MapBounds };

export interface SearchMapMarker {
    id: number;
    name: string | null;
    provider_type: string;
    city: string | null;
    address: string | null;
    lat: number;
    lng: number;
    image: string | null;
    slug: string;
}

interface SearchResultsMapProps {
    markers: SearchMapMarker[];
    hoveredMarkerId?: number | null;
    onBoundsChange?: (bounds: MapBounds) => void;
    initialCenter?: [number, number];
    initialZoom?: number;
    radiusKm?: number;
}

const SearchResultsMapClient = dynamic(
    () => import('@/components/search/SearchResultsMapClient').then((module) => module.SearchResultsMapClient),
    {
        ssr: false,
        loading: () => (
            <Skeleton className="h-full min-h-[300px] w-full rounded-md" />
        ),
    }
);

export function SearchResultsMap({ markers, hoveredMarkerId, onBoundsChange, initialCenter, initialZoom, radiusKm }: SearchResultsMapProps) {
    return (
        <SearchResultsMapClient
            markers={markers}
            hoveredMarkerId={hoveredMarkerId}
            onBoundsChange={onBoundsChange}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            radiusKm={radiusKm}
        />
    );
}
