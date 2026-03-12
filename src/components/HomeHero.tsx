'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Search, MapPin, Loader2, LocateFixed, Clock,
} from 'lucide-react';
import {
    SelectRoot, SelectTrigger, SelectValue,
    SelectContent, SelectItem,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { POPULAR_SERVICES, getGermanCitySuggestions, resolveGermanCity } from '@/constants/searchSuggestions';
import { getHomeStats } from '@/app/actions/getHomeStats';
import { useLocalStorageSearch } from '@/hooks/useLocalStorageSearch';

export default function HomeHero() {
    const formRef = useRef<HTMLFormElement>(null);
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [radius, setRadius] = useState('10');
    const [queryOpen, setQueryOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [validationError, setValidationError] = useState<{ query: boolean; city: boolean }>({ query: false, city: false });

    const SPOTLIGHT_SUGGESTIONS = [
        'Стрижка', 'Маникюр', 'Окрашивание', 'Массаж спины', 'Лазерная эпиляция',
        'Педикюр', 'Брови и ресницы', 'Укладка волос', 'Макияж', 'Шугаринг',
        'Массаж лица', 'Косметология'
    ];
    const [liveStats, setLiveStats] = useState({ masters: 0, services: 0 });
    const router = useRouter();
    const { getStored, setStored } = useLocalStorageSearch();

    useEffect(() => {
        setMounted(true);
        getHomeStats().then(setLiveStats).catch(console.error);
        
        // Delay heavy video element rendering to prioritize LCP image and text
        // Use a longer timeout or wait for load event to ensure LCP finishes first
        const delayVideo = () => setVideoReady(true);
        if (document.readyState === 'complete') {
            setTimeout(delayVideo, 1000);
        } else {
            window.addEventListener('load', () => setTimeout(delayVideo, 500));
        }
        return () => window.removeEventListener('load', () => setTimeout(delayVideo, 500));
    }, []);

    // Память поиска: подставляем последние город и запрос только на клиенте
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = getStored();
        if (stored.city) setCity(stored.city);
        if (stored.query) setQuery(stored.query);
    }, [getStored]);

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
            if (!formRef.current?.contains(event.target as Node)) {
                setQueryOpen(false);
                setCityOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = query.trim();
        const normalizedCity = resolveGermanCity(city.trim()) || city.trim();

        const hasQuery = trimmed.length > 0;
        const hasCity = normalizedCity.length > 0;

        if (!hasQuery || !hasCity) {
            setValidationError({ query: !hasQuery, city: !hasCity });
            toast.error('Пожалуйста, укажите город и желаемую услугу для точного поиска');
            setTimeout(() => setValidationError({ query: false, city: false }), 3000);
            return;
        }

        setValidationError({ query: false, city: false });
        setStored(normalizedCity, trimmed);
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (normalizedCity) params.set('city', normalizedCity);
        if (radius) params.set('radius', radius);
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
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
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'de,en' } }
            );
            if (!response.ok) throw new Error('geo-failed');
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
        <section className="relative w-full h-screen overflow-hidden flex flex-col justify-center">
            {/* LCP Optimized Poster Image */}
            <Image
                src="/hero-bg-poster.webp"
                alt="Фоновое изображение"
                fill
                priority={true}
                fetchPriority="high"
                unoptimized={true}
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Lazy-loaded video for desktop only */}
            {mounted && videoReady && window.innerWidth >= 768 && (
                <video
                    src="/hero-bg.mp4"
                    loop
                    muted
                    playsInline
                    preload="none"
                    onCanPlay={(e) => {
                        setVideoLoaded(true);
                        const video = e.target as HTMLVideoElement;
                        video.play().catch(() => {});
                    }}
                    className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}

            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-black/20" />

            <div className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-4xl mx-auto -translate-y-8 md:-translate-y-12">

                {/* Headline */}
                <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-[72px]">
                    Забронируй местного
                    <br />
                    бьюти‑мастера
                </h1>

                {/* Subtitle */}
                <p className="mx-auto mb-12 max-w-2xl text-base text-white/90 sm:text-lg">
                    Лучшие парикмахеры, мастера маникюра, массажисты и бьюти-эксперты —
                    которым доверяют тысячи клиентов по всей Германии
                </p>

                {/* ── Search bar ── */}
                <div className="relative mx-auto max-w-5xl w-full z-50">
                    <form ref={formRef} onSubmit={handleSearch}>
                        <div className={`flex flex-col items-stretch rounded-2xl bg-white ring-1 md:flex-row md:items-center md:rounded-full transition-all duration-300 ease-out origin-center ${isFocused
                            ? 'scale-[1.05] shadow-[0_8px_40px_rgba(0,0,0,0.25)] ring-white/30 ring-4'
                            : 'scale-100 shadow-[0_2px_24px_rgba(0,0,0,0.10)] ring-[#E8D9C8]'
                            }`}>

                            {/* Service field */}
                            <div className="relative flex flex-1 items-center gap-4 border-b border-gray-100 px-6 py-5 md:border-b-0 md:border-r">
                                <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                                <input
                                    type="text"
                                    value={query}
                                    onFocus={() => { setIsFocused(true); setQueryOpen(query.trim().length > 0); setCityOpen(false); }}
                                    onBlur={() => { setTimeout(() => { setIsFocused(false); setQueryOpen(false); }, 200); }}
                                    onChange={(e) => { const v = e.target.value; setQuery(v); setQueryOpen(v.trim().length > 0); if (validationError.query) setValidationError(prev => ({ ...prev, query: false })); }}
                                    placeholder="Все процедуры и специалисты"
                                    aria-label="Услуга или специалист"
                                    className={`w-full bg-transparent text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 ${validationError.query ? 'ring-2 ring-red-400 rounded-lg bg-red-50/60 px-2' : ''}`}
                                />
                                {queryOpen && query.trim().length > 0 && filteredServices.length > 0 && (
                                    <div className="absolute left-0 top-full z-[100] mt-2 w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl antialiased transform-gpu">
                                        <ul className="max-h-56 overflow-y-auto py-1">
                                            {filteredServices.map((item) => (
                                                <li key={item}>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setQuery(item); setQueryOpen(false); setIsFocused(false); }}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F5F2EB]"
                                                    >
                                                        {item}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* ── Spotlight suggestions dropdown ── */}
                                {isFocused && query.trim().length === 0 && (
                                    <div className="absolute left-0 top-full z-[100] mt-4 w-full rounded-2xl bg-white p-4 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 antialiased transform-gpu">
                                        <div className="flex flex-col gap-1 w-full">
                                            {SPOTLIGHT_SUGGESTIONS.map((sug) => (
                                                <button
                                                    key={sug}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => { setQuery(sug); setIsFocused(false); setQueryOpen(false); }}
                                                    className="w-full text-left pl-[3.25rem] pr-6 py-2.5 hover:bg-slate-50 transition-colors rounded-xl flex items-center text-sm font-medium tracking-wide text-slate-600 hover:text-slate-900 cursor-pointer"
                                                >
                                                    <span className="truncate">{sug}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* City field */}
                            <div className="relative flex flex-1 items-center gap-4 border-b border-gray-100 px-6 py-5 md:border-b-0 md:border-r">
                                <MapPin className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                                <input
                                    type="text"
                                    value={city}
                                    onFocus={() => { setCityOpen(city.trim().length > 0); setQueryOpen(false); }}
                                    onChange={(e) => { const v = e.target.value; setCity(v); setCityOpen(v.trim().length > 0); if (validationError.city) setValidationError(prev => ({ ...prev, city: false })); }}
                                    placeholder="Текущее местоположение"
                                    aria-label="Город"
                                    className={`w-full bg-transparent pr-9 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 ${validationError.city ? 'ring-2 ring-red-400 rounded-lg bg-red-50/60 px-2' : ''}`}
                                />
                                <button
                                    type="button"
                                    title="Определить мой город"
                                    aria-label="Определить мой город"
                                    onClick={handleGeo}
                                    className="absolute right-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                >
                                    {isGeoLoading
                                        ? <Loader2 className="h-5 w-5 animate-spin" />
                                        : <LocateFixed className="h-5 w-5" />
                                    }
                                </button>
                                {cityOpen && city.trim().length > 0 && filteredCities.length > 0 && (
                                    <div className="absolute left-0 top-full z-[100] mt-2 w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl antialiased transform-gpu">
                                        <ul className="max-h-56 overflow-y-auto py-1">
                                            {filteredCities.map((item) => (
                                                <li key={item}>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setCity(item); setCityOpen(false); }}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F5F2EB]"
                                                    >
                                                        {item}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Radius field */}
                            <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5 md:border-b-0 md:border-r">
                                <Clock className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                                <SelectRoot value={radius} onValueChange={setRadius}>
                                    <SelectTrigger aria-label="Радиус поиска" className="text-base text-gray-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 км</SelectItem>
                                        <SelectItem value="10">10 км</SelectItem>
                                        <SelectItem value="20">20 км</SelectItem>
                                        <SelectItem value="30">30 км</SelectItem>
                                        <SelectItem value="50">50 км</SelectItem>
                                    </SelectContent>
                                </SelectRoot>
                            </div>

                            {/* Submit */}
                            <div className="p-2.5">
                                <button
                                    type="submit"
                                    className="w-full rounded-full bg-gray-900 px-10 py-4 text-base font-bold text-white transition-colors hover:bg-gray-700 md:w-auto"
                                >
                                    Найти
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
