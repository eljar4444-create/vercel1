'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchMapMarker {
    id: number;
    name: string;
    providerType: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    city: string;
    address?: string | null;
    lat: number;
    lng: number;
}

interface SearchResultsMapProps {
    markers: SearchMapMarker[];
    hoveredMarkerId?: number | null;
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

export function SearchResultsMap({ markers, hoveredMarkerId }: SearchResultsMapProps) {
    return <SearchResultsMapClient markers={markers} hoveredMarkerId={hoveredMarkerId} />;
}
