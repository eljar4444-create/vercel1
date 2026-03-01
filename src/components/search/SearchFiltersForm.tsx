'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { POPULAR_SERVICES, getGermanCitySuggestions, resolveGermanCity } from '@/constants/searchSuggestions';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorageSearch } from '@/hooks/useLocalStorageSearch';

// ── Top categories ───────────────────────────────────────────────────
const TOP_CATEGORIES = [
    { label: 'Стрижка и укладка',  icon: '✂️' },
    { label: 'Маникюр и педикюр',  icon: '💅' },
    { label: 'Эпиляция',           icon: '🪒' },
    { label: 'Брови и ресницы',    icon: '👁️' },
    { label: 'Косметология',       icon: '🧖' },
    { label: 'Массаж',             icon: '💆' },
    { label: 'Макияж',             icon: '💄' },
    { label: 'Барбершоп',          icon: '💈' },
    { label: 'Спа и велнес',       icon: '🛁' },
    { label: 'Здоровье',           icon: '🌿' },
    { label: 'Тату и пирсинг',     icon: '🎨' },
];

interface SearchFiltersFormProps {
    categoryFilter?: string;
    queryFilter?: string;
    cityFilter?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════
export function SearchFiltersForm({
    categoryFilter,
    queryFilter = '',
    cityFilter = '',
}: SearchFiltersFormProps) {
    const router = useRouter();
    const wrapperRef      = useRef<HTMLDivElement>(null);
    const serviceInputRef = useRef<HTMLInputElement>(null);
    const cityInputRef    = useRef<HTMLInputElement>(null);
    const { getStored, setStored } = useLocalStorageSearch();

    const [query,        setQuery]        = useState(queryFilter);
    const [city,         setCity]         = useState(cityFilter);
    const [isExpanded,   setIsExpanded]   = useState(false);
    const [queryFocused, setQueryFocused] = useState(false);
    const [cityOpen,     setCityOpen]     = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    const debouncedQuery = useDebounce(query.trim(), 300);
    const debouncedCity  = useDebounce(city.trim(),  300);

    // ── Suggestions ──────────────────────────────────────────────────
    const filteredServices = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return POPULAR_SERVICES.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
    }, [query]);

    const filteredCategories = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return TOP_CATEGORIES;
        return TOP_CATEGORIES.filter((c) => c.label.toLowerCase().includes(q));
    }, [query]);

    const filteredCities = useMemo(() => getGermanCitySuggestions(city, 10), [city]);

    // ── Collapse on outside click ────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) {
                setIsExpanded(false);
                setQueryFocused(false);
                setCityOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Sync with URL ─────────────────────────────────────────────────
    useEffect(() => {
        setQuery(queryFilter);
        setCity(cityFilter);
    }, [queryFilter, cityFilter]);

    // ── Restore from localStorage ─────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hasUrlParams = Boolean(queryFilter.trim() || (cityFilter && resolveGermanCity(cityFilter)));
        if (hasUrlParams) {
            setStored(resolveGermanCity(cityFilter) || cityFilter, queryFilter.trim());
            return;
        }
        const stored = getStored();
        if (!stored.city && !stored.query.trim()) return;
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (stored.query.trim()) params.set('q', stored.query.trim());
        if (stored.city) params.set('city', stored.city);
        router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    }, [categoryFilter, queryFilter, cityFilter, router, getStored, setStored]);

    // ── Auto-search on debounced change ──────────────────────────────
    useEffect(() => {
        const normalizedCity = resolveGermanCity(debouncedCity) || debouncedCity;
        const currentCity    = resolveGermanCity(cityFilter)     || cityFilter;
        if (debouncedQuery === queryFilter && normalizedCity === currentCity) return;
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (normalizedCity) params.set('city', normalizedCity);
        setStored(normalizedCity, debouncedQuery);
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    }, [debouncedQuery, debouncedCity, categoryFilter, queryFilter, cityFilter, router]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helpers ──────────────────────────────────────────────────────
    const navigate = (q: string, c: string) => {
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (q.trim()) params.set('q', q.trim());
        const nc = resolveGermanCity(c.trim()) || c.trim();
        if (nc) params.set('city', nc);
        setStored(nc, q.trim());
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
        setIsExpanded(false);
        setQueryFocused(false);
        setCityOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(query, city);
    };

    const handleExpand = (focusField: 'query' | 'city' = 'query') => {
        setIsExpanded(true);
        setTimeout(() => {
            if (focusField === 'query') {
                serviceInputRef.current?.focus();
                setQueryFocused(true);
            } else {
                cityInputRef.current?.focus();
                setCityOpen(true);
            }
        }, 50);
    };

    const handleSelectCategory = (label: string) => {
        const next = label === 'Все услуги' ? '' : label;
        setQuery(next);
        setQueryFocused(false);
        navigate(next, city);
    };

    const handleGeo = async () => {
        if (!navigator.geolocation || isGeoLoading) {
            toast.error('Геолокация недоступна в вашем браузере');
            return;
        }
        setIsGeoLoading(true);
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, {
                    enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
                })
            );
            const r = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'de,en' } }
            );
            if (!r.ok) throw new Error('geo-fail');
            const data = await r.json();
            const addr = data?.address || {};
            const rawCity = addr.city || addr.town || addr.municipality || addr.county || '';
            const resolved = resolveGermanCity(String(rawCity));
            if (!resolved) {
                toast.error('Ваш город не найден в базе. Выберите ближайший крупный город вручную');
                return;
            }
            setCity(resolved);
            setCityOpen(false);
            toast.success(`Определен город: ${resolved}`);
        } catch (err) {
            if ((err as GeolocationPositionError)?.code === 1) {
                toast.error('Доступ к геолокации запрещен');
            } else {
                toast.error('Не удалось определить город автоматически');
            }
        } finally {
            setIsGeoLoading(false);
        }
    };

    const showServiceDropdown = isExpanded && queryFocused;
    const showCityDropdown    = isExpanded && cityOpen && filteredCities.length > 0;

    // ─────────────────────────────────────────────────────────────────
    return (
        <div ref={wrapperRef} className="relative">
            <form onSubmit={handleSubmit}>
                {/*
                 * Single pill — both states live in the same DOM.
                 * CSS transitions handle the visual morph.
                 */}
                <div
                    onClick={!isExpanded ? () => handleExpand() : undefined}
                    className={cn(
                        'flex h-12 items-center rounded-full border bg-white transition-all duration-300 ease-out',
                        isExpanded
                            ? 'border-gray-300 shadow-xl'
                            : 'cursor-pointer border-gray-200 shadow-sm hover:shadow-md'
                    )}
                >
                    {/* ── Service segment ───────────────────────── */}
                    <div className="relative flex min-w-0 flex-1 items-center border-r border-gray-200 h-full">
                        {/* Collapsed label — fades out */}
                        <span
                            className={cn(
                                'pointer-events-none absolute inset-0 flex items-center px-5 text-sm font-medium text-gray-800 select-none transition-opacity duration-200',
                                isExpanded ? 'opacity-0' : 'opacity-100'
                            )}
                        >
                            {query || 'Все услуги'}
                        </span>

                        {/* Expanded: search icon — fades in */}
                        <Search
                            className={cn(
                                'ml-4 h-4 w-4 shrink-0 text-gray-400 transition-opacity duration-200',
                                isExpanded ? 'opacity-100' : 'opacity-0'
                            )}
                        />

                        {/* Expanded: service input — fades in */}
                        <input
                            ref={serviceInputRef}
                            type="text"
                            value={query}
                            onFocus={() => { setQueryFocused(true); setCityOpen(false); }}
                            onChange={(e) => { setQuery(e.target.value); setQueryFocused(true); }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Маникюр, стрижка, массаж..."
                            tabIndex={isExpanded ? 0 : -1}
                            className={cn(
                                'mx-2 h-full w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-opacity duration-200',
                                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            )}
                        />
                    </div>

                    {/* ── City segment ──────────────────────────── */}
                    <div
                        onClick={!isExpanded ? (e) => { e.stopPropagation(); handleExpand('city'); } : undefined}
                        className="relative flex w-52 shrink-0 items-center border-r border-gray-200 h-full"
                    >
                        {/* Collapsed label — fades out */}
                        <span
                            className={cn(
                                'pointer-events-none absolute inset-0 flex items-center px-5 text-sm text-gray-500 select-none transition-opacity duration-200',
                                isExpanded ? 'opacity-0' : 'opacity-100'
                            )}
                        >
                            {city || 'Местоположение'}
                        </span>

                        {/* Expanded: pin icon — fades in */}
                        <MapPin
                            className={cn(
                                'ml-4 h-4 w-4 shrink-0 text-gray-400 transition-opacity duration-200',
                                isExpanded ? 'opacity-100' : 'opacity-0'
                            )}
                        />

                        {/* Expanded: city input — fades in */}
                        <input
                            ref={cityInputRef}
                            type="text"
                            value={city}
                            onFocus={() => { setCityOpen(true); setQueryFocused(false); }}
                            onChange={(e) => { setCity(e.target.value); setCityOpen(true); }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Ваш город"
                            tabIndex={isExpanded ? 0 : -1}
                            className={cn(
                                'ml-2 h-full w-full bg-transparent pr-8 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-opacity duration-200',
                                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            )}
                        />

                        {/* Geo button — fades in */}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleGeo(); }}
                            tabIndex={isExpanded ? 0 : -1}
                            aria-label="Определить мой город"
                            className={cn(
                                'absolute right-3 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700',
                                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            )}
                        >
                            {isGeoLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <LocateFixed className="h-4 w-4" />
                            }
                        </button>
                    </div>

                    {/* ── Search / Submit button ────────────────── */}
                    {/*
                     * Morphs from a 36×36 circle (icon only)
                     * to a 36×92 pill ("Найти" text) via transition-all.
                     */}
                    <button
                        type={isExpanded ? 'submit' : 'button'}
                        aria-label="Найти"
                        onClick={!isExpanded
                            ? (e) => { e.stopPropagation(); navigate(query, city); }
                            : undefined
                        }
                        className={cn(
                            'relative shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-black text-white transition-all duration-300 ease-out hover:bg-gray-800',
                            isExpanded
                                ? 'mx-2 my-1.5 h-9 w-[92px]'
                                : 'mx-1.5 my-1.5 h-9 w-9'
                        )}
                    >
                        {/* Search icon — shown when collapsed */}
                        <Search
                            className={cn(
                                'absolute h-4 w-4 transition-all duration-200',
                                isExpanded ? 'opacity-0 scale-50 rotate-45' : 'opacity-100 scale-100 rotate-0'
                            )}
                        />
                        {/* "Найти" text — shown when expanded */}
                        <span
                            className={cn(
                                'text-sm font-semibold transition-all duration-200',
                                isExpanded ? 'opacity-100 delay-100' : 'opacity-0'
                            )}
                        >
                            Найти
                        </span>
                    </button>
                </div>
            </form>

            {/* ══ SERVICE / CATEGORIES DROPDOWN ═══════════════════════ */}
            {showServiceDropdown && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    {/* "Все услуги" row */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectCategory('Все услуги')}
                        className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                            <Search className="h-4 w-4 text-violet-500" />
                        </span>
                        Все услуги
                    </button>

                    {/* When user typed → show matching services */}
                    {filteredServices.length > 0 && (
                        <ul className="max-h-56 overflow-y-auto py-1">
                            {filteredServices.map((item) => (
                                <li key={item}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => { setQuery(item); setQueryFocused(false); }}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        <Search className="h-4 w-4 shrink-0 text-gray-400" />
                                        {item}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* When empty → show top categories */}
                    {filteredServices.length === 0 && (
                        <>
                            <div className="px-4 pb-1.5 pt-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    Топ-категории
                                </p>
                            </div>
                            <ul className="max-h-72 overflow-y-auto pb-2">
                                {filteredCategories.map((cat) => (
                                    <li key={cat.label}>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSelectCategory(cat.label)}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-base leading-none">
                                                {cat.icon}
                                            </span>
                                            {cat.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}

            {/* ══ CITY DROPDOWN ════════════════════════════════════════ */}
            {showCityDropdown && (
                <div
                    className="absolute top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
                    style={{ left: 'calc(100% - 256px - 104px)' }} /* align under city field */
                >
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {filteredCities.map((item) => (
                            <li key={item}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setCity(item); setCityOpen(false); }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    {item}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
