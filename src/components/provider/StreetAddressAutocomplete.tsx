'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { findGermanCitySelection } from '@/lib/german-city-options';
import { useTranslations } from 'next-intl';

const MIN_QUERY_LENGTH = 3;

export type StreetAddressSuggestion = {
    displayName: string;
    streetName: string;
    lat: number;
    lon: number;
    city: string;
    postcode: string | null;
};

type StreetAddressAutocompleteProps = {
    value: string;
    city: string;
    disabled?: boolean;
    isValidated: boolean;
    onValueChange: (value: string) => void;
    onSuggestionSelect: (suggestion: StreetAddressSuggestion) => void;
    placeholder?: string;
    className?: string;
};

export function StreetAddressAutocomplete({
    value,
    city,
    disabled = false,
    isValidated,
    onValueChange,
    onSuggestionSelect,
    placeholder,
    className,
}: StreetAddressAutocompleteProps) {
    const t = useTranslations('forms.streetAddress');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [results, setResults] = useState<StreetAddressSuggestion[]>([]);
    const debouncedQuery = useDebounce(value.trim(), 400);

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    useEffect(() => {
        const selectedCity = findGermanCitySelection(city)?.germanName || '';

        if (!isOpen || disabled) return;
        if (debouncedQuery.length < MIN_QUERY_LENGTH) {
            setIsLoading(false);
            setResults([]);
            setSearchError(null);
            return;
        }

        if (!selectedCity) {
            setIsLoading(false);
            setResults([]);
            setSearchError(t('cityRequired'));
            return;
        }

        const controller = new AbortController();
        const loadResults = async () => {
            setIsLoading(true);
            setSearchError(null);

            try {
                const params = new URLSearchParams({
                    q: debouncedQuery,
                    city: selectedCity,
                });
                const response = await fetch(`/api/addresses/search?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                });

                const payload = (await response.json()) as {
                    results?: StreetAddressSuggestion[];
                    error?: string;
                };

                if (!response.ok) {
                    throw new Error(payload.error || 'search-failed');
                }

                const normalizedQuery = debouncedQuery.toLowerCase();
                const filteredResults = Array.isArray(payload.results)
                    ? payload.results.filter((result) =>
                        result.streetName.toLowerCase().includes(normalizedQuery)
                    )
                    : [];

                setResults(filteredResults);
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    return;
                }

                console.error('[StreetAddressAutocomplete] search failed:', error);
                setResults([]);
                setSearchError(t('loadError'));
            } finally {
                setIsLoading(false);
            }
        };

        void loadResults();

        return () => controller.abort();
    }, [city, debouncedQuery, disabled, isOpen, t]);

    const query = value.trim();
    const showDropdown = !disabled && isOpen && Boolean(query);
    const showMinLengthHint = query.length > 0 && query.length < MIN_QUERY_LENGTH;

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                type="text"
                value={value}
                onFocus={() => {
                    if (!disabled) setIsOpen(true);
                }}
                onChange={(event) => {
                    onValueChange(event.target.value);
                    if (!disabled) setIsOpen(true);
                }}
                placeholder={placeholder ?? t('placeholder')}
                disabled={disabled}
                autoComplete="off"
                className={cn('h-11 rounded-xl border-gray-300 bg-white pr-10 text-sm disabled:bg-gray-50', className)}
            />

            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isValidated ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                    <MapPin className="h-4 w-4" />
                )}
            </div>

            {showDropdown ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    {showMinLengthHint ? (
                        <div className="px-3 py-3 text-sm text-gray-500">
                            {t('minLength')}
                        </div>
                    ) : null}

                    {!showMinLengthHint && searchError ? (
                        <div className="px-3 py-3 text-sm text-gray-500">
                            {searchError}
                        </div>
                    ) : null}

                    {!showMinLengthHint && !searchError && !isLoading && results.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-gray-500">
                            {t('notFound')}
                        </div>
                    ) : null}

                    {!showMinLengthHint && !searchError && results.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto py-1">
                            {results.map((result) => (
                                <button
                                    key={`${result.streetName}-${result.lat}-${result.lon}`}
                                    type="button"
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        onSuggestionSelect(result);
                                        setIsOpen(false);
                                        setResults([]);
                                        setSearchError(null);
                                    }}
                                    className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-gray-50"
                                >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                    <span className="text-sm text-gray-700">{result.displayName}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
