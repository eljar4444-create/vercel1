'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PROVIDER_LANGUAGE_OPTIONS } from '@/lib/provider-languages';

interface ActiveFiltersProps {
    cityFilter?: string;
    queryFilter?: string;
    languageFilter?: string;
}

export function ActiveFilters({ cityFilter, queryFilter, languageFilter }: ActiveFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('search.filters');
    const activeLanguage = PROVIDER_LANGUAGE_OPTIONS.find((option) => option.value === languageFilter);

    // Resolve the location: prefer the prop, fall back to the `location` URL param
    const locationParam = searchParams.get('location');
    const resolvedCity = cityFilter || locationParam || undefined;
    // Track which URL key to delete when the user removes the chip
    const cityParamKey = searchParams.has('city') ? 'city' : 'location';

    if (!resolvedCity && !queryFilter && !activeLanguage) return null;

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete(key);

        if (key === 'city' || key === 'location') {
            params.delete('city');
            params.delete('location');
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
            {resolvedCity && (
            <button
                    onClick={() => removeFilter(cityParamKey)}
                    aria-label={t('removeFilter', { label: resolvedCity })}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[#E5D5C5] px-3 py-1.5 text-xs font-medium text-[#4A3B32] transition hover:bg-[#d9c8b5]"
                >
                    {resolvedCity}
                    <X className="h-3 w-3" />
                </button>
            )}
            {queryFilter && (
                <button
                    onClick={() => removeFilter('q')}
                    aria-label={t('removeFilter', { label: queryFilter })}
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
                    aria-label={t('removeFilter', { label: activeLanguage.label })}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[#E5D5C5] px-3 py-1.5 text-xs font-medium text-[#4A3B32] transition hover:bg-[#d9c8b5]"
                >
                    {activeLanguage.flag} {activeLanguage.label}
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
