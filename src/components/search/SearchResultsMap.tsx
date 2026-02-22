'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface SearchMapMarker {
    id: number;
    name: string;
    providerType: 'SALON' | 'PRIVATE';
    city: string;
    address?: string | null;
    lat: number;
    lng: number;
}

interface SearchResultsMapProps {
    markers: SearchMapMarker[];
}

const SearchResultsMapClient = dynamic(
    () => import('@/components/search/SearchResultsMapClient').then((module) => module.SearchResultsMapClient),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        ),
    }
);

export function SearchResultsMap({ markers }: SearchResultsMapProps) {
    return <SearchResultsMapClient markers={markers} />;
}
