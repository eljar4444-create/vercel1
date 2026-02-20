'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resolveGermanCity } from '@/constants/searchSuggestions';

interface SearchBarProps {
    /** Additional classes for the outer wrapper */
    className?: string;
    /** Initial query value (e.g. from URL) */
    defaultQuery?: string;
    /** Initial city value (e.g. from URL) */
    defaultCity?: string;
}

export function SearchBar({ className = '', defaultQuery = '', defaultCity = '' }: SearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = useState(defaultQuery);
    const [city, setCity] = useState(defaultCity);
    const [isLocating, setIsLocating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (city.trim()) params.set('city', city.trim());
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const handleLocateMe = async () => {
        if (!navigator.geolocation || isLocating) {
            toast.error('Геолокация недоступна в вашем браузере');
            return;
        }

        setIsLocating(true);
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
            const rawCity = address.city || address.town || address.village || address.municipality || '';
            const matchedCity = resolveGermanCity(String(rawCity));

            if (!matchedCity) {
                toast.error('Не удалось точно определить город из нашей базы. Пожалуйста, введите ближайший крупный город вручную');
                return;
            }

            setCity(matchedCity);
            toast.success(`Определен город: ${matchedCity}`);
        } catch (error) {
            if ((error as GeolocationPositionError)?.code === 1) {
                toast.error('Доступ к геолокации запрещен');
                return;
            }
            toast.error('Не удалось точно определить город из нашей базы. Пожалуйста, введите ближайший крупный город вручную');
        } finally {
            setIsLocating(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={className}>
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-gray-100">
                <div className="flex-1 flex items-center gap-3 pl-4 min-w-0">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Найти: Маникюр, Стоматолог, Педиатр..."
                        className="w-full py-3 text-base text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                    />
                </div>
                <div className="relative md:w-72 flex items-center gap-3 pl-4 pr-2 border-t md:border-t-0 md:border-l border-gray-100 min-w-0">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Где? / Город"
                        className="w-full py-3 pr-9 text-base text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleLocateMe}
                        title="Определить мой город"
                        aria-label="Определить мой город"
                        className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                        disabled={isLocating}
                    >
                        {isLocating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <LocateFixed className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <button
                    type="submit"
                    className="bg-[#fc0] hover:bg-[#e6b800] text-gray-900 font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center gap-2 flex-shrink-0"
                >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Найти</span>
                </button>
            </div>
        </form>
    );
}
