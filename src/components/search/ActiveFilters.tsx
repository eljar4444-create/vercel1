'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface ActiveFiltersProps {
    cityFilter?: string;
    queryFilter?: string;
    radiusKm?: number;
    hasGeoCenter?: boolean;
}

export function ActiveFilters({ cityFilter, queryFilter, radiusKm, hasGeoCenter }: ActiveFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    if (!cityFilter && !queryFilter) return null;

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete(key);

        if (key === 'city') {
            params.delete('lat');
            params.delete('lng');
        }

        router.push(`/search?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {cityFilter && (
                <button
                    onClick={() => removeFilter('city')}
                    aria-label={`Удалить фильтр: ${cityFilter}`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                >
                    {cityFilter}{hasGeoCenter && radiusKm ? ` (${radiusKm} км)` : ''}
                    <X className="h-3 w-3" />
                </button>
            )}
            {queryFilter && (
                <button
                    onClick={() => removeFilter('q')}
                    aria-label={`Удалить фильтр: ${queryFilter}`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
                >
                    <Search className="h-3 w-3" />
                    {queryFilter}
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
