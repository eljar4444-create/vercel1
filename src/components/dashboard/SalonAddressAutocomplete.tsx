'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Lock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const MIN_QUERY_LENGTH = 3;

export type SalonAddressSuggestion = {
    displayName: string;
    cleanDisplayName: string;
    lat: number;
    lon: number;
    city: string | null;
};

interface SalonAddressAutocompleteProps {
    value: string;
    city: string;
    isValidated: boolean;
    disabled?: boolean;
    onValueChange: (value: string) => void;
    onSuggestionSelect: (suggestion: SalonAddressSuggestion) => void;
    className?: string;
}

export function SalonAddressAutocomplete({
    value,
    city,
    isValidated,
    disabled = false,
    onValueChange,
    onSuggestionSelect,
    className,
}: SalonAddressAutocompleteProps) {
    const t = useTranslations('dashboard.provider.addressAutocomplete');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [results, setResults] = useState<SalonAddressSuggestion[]>([]);

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
        const query = value.trim();
        const selectedCity = city.trim();

        if (!isOpen) return;
        if (disabled) return;

        if (query.length < MIN_QUERY_LENGTH) {
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
        const timeoutId = window.setTimeout(async () => {
            setIsLoading(true);
            setSearchError(null);

            try {
                const params = new URLSearchParams({
                    q: query,
                    city: selectedCity,
                });
                const response = await fetch(`/api/addresses/search?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                    headers: {
                        'Accept-Language': 'de,ru',
                    },
                });

                const payload = (await response.json()) as {
                    results?: SalonAddressSuggestion[];
                    error?: string;
                };

                if (!response.ok) {
                    throw new Error(payload.error || 'search-failed');
                }

                setResults(Array.isArray(payload.results) ? payload.results : []);
            } catch (error) {
                if ((error as Error).name === 'AbortError') {
                    return;
                }

                console.error('[SalonAddressAutocomplete] search failed:', error);
                setResults([]);
                setSearchError(t('loadError'));
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [city, disabled, isOpen, t, value]);

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
                disabled={disabled}
                placeholder={t('placeholder')}
                autoComplete="off"
                className={cn('h-10 bg-gray-50 pr-10 text-sm', className)}
            />

            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {disabled ? (
                    <Lock className="h-4 w-4" />
                ) : isLoading ? (
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
                        <div className="px-3 py-3 text-sm text-red-600">
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
                                    key={`${result.displayName}-${result.lat}-${result.lon}`}
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
                                    <span className="text-sm text-gray-700">{result.cleanDisplayName}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
