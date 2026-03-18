'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    findGermanCitySelection,
    GERMAN_CITY_OPTIONS,
    normalizeGermanCityName,
    type GermanCitySelection,
} from '@/lib/german-city-options';
import toast from 'react-hot-toast';

interface CityComboboxProps {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    onCitySelect?: (city: GermanCitySelection) => void;
    onZipCodeDetect?: (zipCode: string) => void;
    placeholder?: string;
}

export function CityCombobox({
    name,
    value,
    onValueChange,
    onCitySelect,
    onZipCodeDetect,
    placeholder = 'Начните вводить ваш город...',
}: CityComboboxProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const [query, setQuery] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => {
        const matched = findGermanCitySelection(value);
        setQuery(matched?.germanName || value);
    }, [value]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const uniqueCities = useMemo(() => {
        const seen = new Set<string>();
        return GERMAN_CITY_OPTIONS.filter((city) => {
            if (seen.has(city.germanName)) return false;
            seen.add(city.germanName);
            return true;
        });
    }, []);

    const filteredCities = useMemo(() => {
        const normalizedQuery = normalizeGermanCityName(query);
        const base = uniqueCities;

        if (!normalizedQuery) {
            return base.slice(0, 80);
        }

        return base
            .filter((city) => {
                const normalizedValue = normalizeGermanCityName(city.germanName);
                return (
                    normalizedValue.includes(normalizedQuery) ||
                    city.aliases.some((alias) => alias.includes(normalizedQuery)) ||
                    city.searchText.includes(query.toLowerCase())
                );
            })
            .slice(0, 80);
    }, [query, uniqueCities]);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredCities.length, query]);

    const aliasMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const city of uniqueCities) {
            map.set(normalizeGermanCityName(city.germanName), city.germanName);
            for (const alias of city.aliases) {
                if (!map.has(alias)) map.set(alias, city.germanName);
            }
        }
        return map;
    }, [uniqueCities]);

    const resolveCityFromGeolocation = (rawCity: string) => {
        const normalized = normalizeGermanCityName(rawCity);
        if (!normalized) return null;

        const direct = aliasMap.get(normalized);
        if (direct) return direct;

        const fallbackMap: Record<string, string> = {
            cologne: 'кёльн',
            munich: 'мюнхен',
            nuremberg: 'нюрнберг',
            frankfurt: 'франкфурт',
            dusseldorf: 'дюссельдорф',
        };
        const mapped = fallbackMap[normalized];
        if (mapped) {
            const resolved = aliasMap.get(mapped);
            if (resolved) return resolved;
        }

        let fuzzyMatch: string | null = null;
        aliasMap.forEach((valueFromMap, alias) => {
            if (!fuzzyMatch && (alias.includes(normalized) || normalized.includes(alias))) {
                fuzzyMatch = valueFromMap;
            }
        });
        if (fuzzyMatch) return fuzzyMatch;

        return null;
    };

    const selectCity = (city: GermanCitySelection) => {
        setQuery(city.germanName);
        onValueChange(city.germanName);
        onCitySelect?.(city);
        setOpen(false);
    };

    const handleInputChange = (nextValue: string) => {
        setQuery(nextValue);
        onValueChange(nextValue);
        setOpen(true);

        const exactMatch = findGermanCitySelection(nextValue);
        if (
            exactMatch &&
            exactMatch.aliases.includes(normalizeGermanCityName(nextValue))
        ) {
            setQuery(exactMatch.germanName);
            onValueChange(exactMatch.germanName);
            onCitySelect?.(exactMatch);
        }
    };

    const handleGeolocation = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!navigator.geolocation || isGeoLoading) {
            toast('Не удалось определить местоположение. Пожалуйста, выберите город из списка вручную.');
            return;
        }

        setIsGeoLoading(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                });
            });

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'de,en',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('reverse-geocoding-failed');
            }

            const data = await response.json();
            const address = data?.address || {};
            const rawCity =
                address.city ||
                address.town ||
                address.municipality ||
                address.county ||
                '';
            const postalCode = typeof address.postcode === 'string' ? address.postcode.trim() : '';

            const matchedCity = resolveCityFromGeolocation(String(rawCity));
            if (!matchedCity) {
                toast('Не удалось определить местоположение. Пожалуйста, выберите город из списка вручную.');
                return;
            }

            const matchedSelection = findGermanCitySelection(matchedCity);
            if (matchedSelection) {
                selectCity(matchedSelection);
            } else {
                onValueChange(matchedCity);
            }
            if (postalCode) {
                onZipCodeDetect?.(postalCode);
            }
            toast.success(`Определен город: ${matchedCity}`);
        } catch (error) {
            toast('Не удалось определить местоположение. Пожалуйста, выберите город из списка вручную.');
        } finally {
            setIsGeoLoading(false);
        }
    };

    return (
        <div ref={containerRef}>
            <input type="hidden" name={name} value={value} />
            <div className="relative">
                <input
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    value={query}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(event) => {
                        if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
                            setOpen(true);
                            return;
                        }

                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            if (!filteredCities.length) return;
                            setHighlightedIndex((current) => Math.min(current + 1, filteredCities.length - 1));
                        }

                        if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            if (!filteredCities.length) return;
                            setHighlightedIndex((current) => Math.max(current - 1, 0));
                        }

                        if (event.key === 'Enter' && open && filteredCities[highlightedIndex]) {
                            event.preventDefault();
                            selectCity(filteredCities[highlightedIndex]);
                        }

                        if (event.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 pr-20 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                />
                {open ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        {filteredCities.length ? (
                            <div className="max-h-64 overflow-y-auto py-1">
                                {filteredCities.map((city, index) => (
                                    <button
                                        key={city.value}
                                        type="button"
                    onMouseDown={(event) => {
                        event.preventDefault();
                        selectCity(city);
                                        }}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={cn(
                                            'flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-slate-50',
                                            index === highlightedIndex && 'bg-slate-50',
                                            normalizeGermanCityName(value) === normalizeGermanCityName(city.germanName) &&
                                                'text-slate-900'
                                        )}
                                    >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    normalizeGermanCityName(value) === normalizeGermanCityName(city.germanName)
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                        <span className="truncate">
                                            {city.germanName}
                                            {city.russianName && city.russianName !== city.germanName
                                                ? ` (${city.russianName})`
                                                : ''}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-3 py-3 text-sm text-gray-500">
                                Город не найден. Выберите ближайший крупный город
                            </div>
                        )}
                    </div>
                ) : null}
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleGeolocation}
                        disabled={isGeoLoading}
                        title="Определить мой город"
                        aria-label="Определить мой город"
                        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGeoLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LocateFixed className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen((current) => !current)}
                        aria-label="Открыть список городов"
                        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                        <ChevronsUpDown className="h-4 w-4 shrink-0" />
                    </button>
                </div>
            </div>
        </div>
    );
}
