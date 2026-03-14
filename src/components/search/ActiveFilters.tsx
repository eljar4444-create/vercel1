'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { PROVIDER_LANGUAGE_OPTIONS } from '@/lib/provider-languages';

interface ActiveFiltersProps {
    cityFilter?: string;
    queryFilter?: string;
    languageFilter?: string;
}

export function ActiveFilters({ cityFilter, queryFilter, languageFilter }: ActiveFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeLanguage = PROVIDER_LANGUAGE_OPTIONS.find((option) => option.value === languageFilter);

    if (!cityFilter && !queryFilter && !activeLanguage) return null;

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete(key);

        if (key === 'city') {
            params.delete('lat');
            params.delete('lng');
            params.delete('minLat');
            params.delete('maxLat');
            params.delete('minLng');
            params.delete('maxLng');
        }

        router.push(`/search?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {cityFilter && (
            <button
                    onClick={() => removeFilter('city')}
                    aria-label={`Удалить фильтр: ${cityFilter}`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[#E5D5C5] px-3 py-1.5 text-xs font-medium text-[#4A3B32] transition hover:bg-[#d9c8b5]"
                >
                    {cityFilter}
                    <X className="h-3 w-3" />
                </button>
            )}
            {queryFilter && (
                <button
                    onClick={() => removeFilter('q')}
                    aria-label={`Удалить фильтр: ${queryFilter}`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[#E5D5C5] px-3 py-1.5 text-xs font-medium text-[#4A3B32] transition hover:bg-[#d9c8b5]"
                >
                    <Search className="h-3 w-3" />
                    {queryFilter}
                    <X className="h-3 w-3" />
                </button>
            )}
            {activeLanguage && (
                <button
                    onClick={() => removeFilter('language')}
                    aria-label={`Удалить фильтр: ${activeLanguage.label}`}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[#E5D5C5] px-3 py-1.5 text-xs font-medium text-[#4A3B32] transition hover:bg-[#d9c8b5]"
                >
                    {activeLanguage.flag} {activeLanguage.label}
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
