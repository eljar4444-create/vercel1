'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

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
