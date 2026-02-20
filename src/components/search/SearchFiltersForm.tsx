'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LocateFixed, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { GERMAN_CITY_SUGGESTIONS, POPULAR_SERVICES, resolveGermanCity } from '@/constants/searchSuggestions';

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

    const filteredServices = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? POPULAR_SERVICES.filter((item) => item.toLowerCase().includes(q))
            : POPULAR_SERVICES;
        return base.slice(0, 8);
    }, [query]);

    const filteredCities = useMemo(() => {
        const q = city.trim().toLowerCase();
        const base = q
            ? GERMAN_CITY_SUGGESTIONS.filter((item) => item.toLowerCase().includes(q))
            : GERMAN_CITY_SUGGESTIONS;
        return base.slice(0, 10);
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (query.trim()) params.set('q', query.trim());
        if (city.trim()) params.set('city', city.trim());
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
            className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col md:flex-row gap-2 border border-white/10"
        >
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onFocus={() => {
                        setQueryOpen(true);
                        setCityOpen(false);
                    }}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Что ищем?"
                    className="w-full h-12 pl-12 pr-4 bg-white/10 text-white placeholder:text-gray-400 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm font-medium"
                />
                {queryOpen && (
                    <div className="absolute top-full mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Популярное</div>
                        <ul className="max-h-64 overflow-y-auto">
                            {filteredServices.length ? (
                                filteredServices.map((item) => (
                                    <li key={item}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQuery(item);
                                                setQueryOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {item}
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="px-3 py-3 text-sm text-gray-500">Ничего не найдено</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            <div className="relative flex-1 md:max-w-[260px]">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={city}
                    onFocus={() => {
                        setCityOpen(true);
                        setQueryOpen(false);
                    }}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Где?"
                    className="w-full h-12 pl-12 pr-12 bg-white/10 text-white placeholder:text-gray-400 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm font-medium"
                />
                <button
                    type="button"
                    title="Определить мой город"
                    aria-label="Определить мой город"
                    onClick={handleGeo}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 hover:bg-white/15 hover:text-white transition"
                >
                    {isGeoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                </button>
                {cityOpen && (
                    <div className="absolute top-full mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden">
                        <ul className="max-h-64 overflow-y-auto">
                            {filteredCities.length ? (
                                filteredCities.map((item) => (
                                    <li key={item}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCity(item);
                                                setCityOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {item}
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="px-3 py-3 text-sm text-gray-500">Город не найден</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            <button
                type="submit"
                className="h-12 px-8 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap"
            >
                <SlidersHorizontal className="w-4 h-4" />
                Найти
            </button>
        </form>
    );
}

