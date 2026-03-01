'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { POPULAR_SERVICES, getGermanCitySuggestions, resolveGermanCity } from '@/constants/searchSuggestions';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFiltersFormProps {
    categoryFilter?: string;
    queryFilter?: string;
    cityFilter?: string;
}

export function SearchFiltersForm({
    categoryFilter,
    queryFilter = '',
    cityFilter = '',
}: SearchFiltersFormProps) {
    const router = useRouter();
    const wrapperRef = useRef<HTMLFormElement>(null);

    const [query, setQuery] = useState(queryFilter);
    const [city, setCity] = useState(cityFilter);
    const [queryOpen, setQueryOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    const debouncedQuery = useDebounce(query.trim(), 300);
    const debouncedCity = useDebounce(city.trim(), 300);

    const filteredServices = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? POPULAR_SERVICES.filter((item) => item.toLowerCase().includes(q))
            : POPULAR_SERVICES;
        return base.slice(0, 8);
    }, [query]);

    const filteredCities = useMemo(() => {
        return getGermanCitySuggestions(city, 10);
    }, [city]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setQueryOpen(false);
                setCityOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        const normalizedCity = resolveGermanCity(debouncedCity) || debouncedCity;
        const currentCity = resolveGermanCity(cityFilter) || cityFilter;
        if (debouncedQuery === queryFilter && normalizedCity === currentCity) return;
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (normalizedCity) params.set('city', normalizedCity);
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    }, [debouncedQuery, debouncedCity, categoryFilter, queryFilter, cityFilter, router]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (query.trim()) params.set('q', query.trim());
        const normalizedCity = resolveGermanCity(city.trim()) || city.trim();
        if (normalizedCity) params.set('city', normalizedCity);
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
        setQueryOpen(false);
        setCityOpen(false);
    };

    const handleGeo = async () => {
        if (!navigator.geolocation || isGeoLoading) {
            toast.error('Геолокация недоступна в вашем браузере');
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
                { headers: { 'Accept-Language': 'de,en' } }
            );
            if (!response.ok) throw new Error('geolocation-failed');
            const data = await response.json();
            const address = data?.address || {};
            const rawCity = address.city || address.town || address.municipality || address.county || '';

            const resolved = resolveGermanCity(String(rawCity));
            if (!resolved) {
                toast.error('Ваш город не найден в базе. Выберите ближайший крупный город вручную');
                return;
            }
            setCity(resolved);
            setCityOpen(false);
            toast.success(`Определен город: ${resolved}`);
        } catch (error) {
            if ((error as GeolocationPositionError)?.code === 1) {
                toast.error('Доступ к геолокации запрещен');
            } else {
                toast.error('Не удалось определить город автоматически');
            }
        } finally {
            setIsGeoLoading(false);
        }
    };

    return (
        <form
            ref={wrapperRef}
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-1"
        >
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-[1fr_240px_112px]">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onFocus={() => {
                            setQueryOpen(query.trim().length > 0);
                            setCityOpen(false);
                        }}
                        onChange={(e) => {
                            const next = e.target.value;
                            setQuery(next);
                            setQueryOpen(next.trim().length > 0);
                        }}
                        placeholder="Маникюр, стрижка, массаж, салон..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    {queryOpen && query.trim().length > 0 && filteredServices.length > 0 && (
                        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                            <ul className="max-h-64 overflow-y-auto">
                                {filteredServices.map((item) => (
                                    <li key={item}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuery(item);
                                                setQueryOpen(false);
                                            }}
                                            className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {item}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={city}
                        onFocus={() => {
                            setCityOpen(city.trim().length > 0);
                            setQueryOpen(false);
                        }}
                        onChange={(e) => {
                            const next = e.target.value;
                            setCity(next);
                            setCityOpen(next.trim().length > 0);
                        }}
                        placeholder="Город"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <button
                        type="button"
                        title="Определить мой город"
                        aria-label="Определить мой город"
                        onClick={handleGeo}
                        className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        {isGeoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    </button>
                    {cityOpen && city.trim().length > 0 && filteredCities.length > 0 && (
                        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                            <ul className="max-h-64 overflow-y-auto">
                                {filteredCities.map((item) => (
                                    <li key={item}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCity(item);
                                                setCityOpen(false);
                                            }}
                                            className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {item}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800"
                >
                    <Search className="h-4 w-4" />
                    <span className="hidden md:inline">Найти</span>
                </button>
            </div>
        </form>
    );
}

