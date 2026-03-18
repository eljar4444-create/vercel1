'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CitySuggestion = {
    name: string;
    displayName: string;
    lat: number;
    lon: number;
};

interface CityAutocompleteProps {
    value: string;
    isValidated: boolean;
    onValueChange: (value: string) => void;
    onSuggestionSelect: (suggestion: CitySuggestion) => void;
    className?: string;
}

export function CityAutocomplete({
    value,
    isValidated,
    onValueChange,
    onSuggestionSelect,
    className,
}: CityAutocompleteProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [results, setResults] = useState<CitySuggestion[]>([]);

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
        if (!isOpen) return;

        if (query.length < 2) {
            setIsLoading(false);
            setResults([]);
            setSearchError(null);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsLoading(true);
            setSearchError(null);

            try {
                const params = new URLSearchParams({ q: query });
                const response = await fetch(`/api/cities/search?${params.toString()}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                });

                const payload = (await response.json()) as {
                    results?: CitySuggestion[];
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

                console.error('[CityAutocomplete] search failed:', error);
                setResults([]);
                setSearchError('Не удалось загрузить города. Попробуйте еще раз.');
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [isOpen, value]);

    const query = value.trim();
    const showDropdown = isOpen && Boolean(query);
    const showMinLengthHint = query.length > 0 && query.length < 2;

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                type="text"
                value={value}
                onFocus={() => setIsOpen(true)}
                onChange={(event) => {
                    onValueChange(event.target.value);
                    setIsOpen(true);
                }}
                placeholder="Начните вводить город"
                autoComplete="off"
                className={cn('h-10 bg-gray-50 pr-10 text-sm', className)}
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
                            Введите минимум 2 символа для поиска города.
                        </div>
                    ) : null}

                    {!showMinLengthHint && searchError ? (
                        <div className="px-3 py-3 text-sm text-red-600">
                            {searchError}
                        </div>
                    ) : null}

                    {!showMinLengthHint && !searchError && !isLoading && results.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-gray-500">
                            Города не найдены. Уточните запрос.
                        </div>
                    ) : null}

                    {!showMinLengthHint && !searchError && results.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto py-1">
                            {results.map((result) => (
                                <button
                                    key={`${result.name}-${result.lat}-${result.lon}`}
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
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-700">{result.name}</div>
                                        <div className="truncate text-xs text-gray-500">{result.displayName}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
