'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import {
    SelectRoot, SelectTrigger, SelectValue,
    SelectContent, SelectItem,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { POPULAR_SERVICES, TOP_CATEGORIES, resolveGermanCity } from '@/constants/searchSuggestions';
import { GERMAN_CITIES } from '@/constants/germanCities';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorageSearch } from '@/hooks/useLocalStorageSearch';

export interface NominatimSuggestion {
    display_name: string;
    lat: string;
    lon: string;
}

interface SearchFiltersFormProps {
    categoryFilter?: string;
    queryFilter?: string;
    cityFilter?: string;
    radiusFilter?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════
export function SearchFiltersForm({
    categoryFilter,
    queryFilter = '',
    cityFilter = '',
    radiusFilter = '10',
}: SearchFiltersFormProps) {
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const serviceInputRef = useRef<HTMLInputElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);
    const { getStored, setStored } = useLocalStorageSearch();

    const [query, setQuery] = useState(queryFilter);
    const [city, setCity] = useState(cityFilter);
    const [radius, setRadius] = useState(radiusFilter);
    const [isExpanded, setIsExpanded] = useState(false);
    const [queryFocused, setQueryFocused] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    const debouncedQuery = useDebounce(query.trim(), 300);
    const debouncedCity = useDebounce(city, 500);

    const [citySuggestions, setCitySuggestions] = useState<NominatimSuggestion[]>([]);

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

    // Filter Local City Suggestions
    useEffect(() => {
        const query = debouncedCity.trim().toLowerCase();
        if (query.length < 2) {
            setCitySuggestions([]);
            return;
        }

        type CityData = { importance: number; lat: string; lon: string; display_name: string };
        type CityObj = { names: string[]; data: CityData };

        const matches = GERMAN_CITIES.filter((cityObj: CityObj) => {
            return cityObj.names.some((name: string) => name.toLowerCase().includes(query));
        });

        // Sort by importance (higher is better) and take top 5
        const topMatches = matches
            .sort((a: CityObj, b: CityObj) => b.data.importance - a.data.importance)
            .slice(0, 5);

        const mappedSuggestions = topMatches.map((match: CityObj) => ({
            display_name: match.data.display_name,
            lat: match.data.lat,
            lon: match.data.lon,
        }));

        setCitySuggestions(mappedSuggestions);
    }, [debouncedCity]);

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
        setRadius(radiusFilter);
    }, [queryFilter, cityFilter, radiusFilter]);

    // ── Restore from localStorage ─────────────────────────────────────
    // ── Restore from localStorage ─────────────────────────────────────
    const hasAttemptedRestore = useRef(false);

    useEffect(() => {
        if (hasAttemptedRestore.current) {
            // Once restored (or skipped), we only update localStorage, never force the URL back.
            setStored(
                cityFilter ? (resolveGermanCity(cityFilter) || cityFilter) : '',
                queryFilter ? queryFilter.trim() : ''
            );
            return;
        }

        hasAttemptedRestore.current = true;

        const hasUrlParams = Boolean(queryFilter?.trim() || (cityFilter && resolveGermanCity(cityFilter)));
        if (hasUrlParams) {
            setStored(
                resolveGermanCity(cityFilter) || cityFilter,
                queryFilter ? queryFilter.trim() : ''
            );
            return;
        }

        const stored = getStored();
        if (!stored.city && !stored.query.trim()) return;

        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (stored.query.trim()) params.set('q', stored.query.trim());
        if (stored.city) params.set('city', stored.city);
        if (radiusFilter) params.set('radius', radiusFilter);

        // Use router.replace to avoid clogging the history stack on first load
        router.replace(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    }, [categoryFilter, queryFilter, cityFilter, radiusFilter, router, getStored, setStored]);

    // (Removed aggressive auto-search on debounced change)

    // ── Helpers ──────────────────────────────────────────────────────
    const navigate = (q: string, c: string, r: string, lat?: string | null, lng?: string | null) => {
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (q.trim()) params.set('q', q.trim());
        const nc = resolveGermanCity(c.trim()) || c.trim();
        if (nc) params.set('city', nc);
        if (r) params.set('radius', r);
        if (lat && lng) {
            params.set('lat', lat);
            params.set('lng', lng);
        }
        setStored(nc, q.trim());
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
        setIsExpanded(false);
        setQueryFocused(false);
        setCityOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(query, city, radius);
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
        navigate(next, city, radius);
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
    const showCityDropdown = isExpanded && cityOpen && citySuggestions.length > 0;

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
                            ? 'border-[#E5E0D8] shadow-xl'
                            : 'cursor-pointer border-[#E5E0D8] shadow-sm hover:shadow-md'
                    )}
                >
                    {/* ── Service segment ───────────────────────── */}
                    <div className="relative flex min-w-0 flex-1 items-center border-r border-[#E5E0D8] h-full">
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
                        className="relative flex w-52 shrink-0 items-center border-r border-[#E5E0D8] h-full"
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

                    {/* ── Radius segment ──────────────────────────── */}
                    <div className="relative flex w-24 shrink-0 items-center justify-center border-r border-[#E5E0D8] h-full">
                        <SelectRoot
                            value={radius}
                            onValueChange={(val) => {
                                setRadius(val);
                                navigate(query, city, val);
                            }}
                        >
                            <SelectTrigger aria-label="Радиус поиска" className="px-3 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2">+ 2 км</SelectItem>
                                <SelectItem value="5">+ 5 км</SelectItem>
                                <SelectItem value="10">+ 10 км</SelectItem>
                                <SelectItem value="20">+ 20 км</SelectItem>
                                <SelectItem value="50">+ 50 км</SelectItem>
                            </SelectContent>
                        </SelectRoot>
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
                            ? (e) => { e.stopPropagation(); navigate(query, city, radius); }
                            : undefined
                        }
                        className={cn(
                            'relative shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-stone-800 text-white transition-all duration-300 ease-out hover:bg-stone-700',
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
                <ServiceDropdown
                    filteredServices={filteredServices}
                    filteredCategories={filteredCategories}
                    onSelectCategory={handleSelectCategory}
                    onSelectService={(item) => {
                        setQuery(item);
                        setQueryFocused(false);
                    }}
                />
            )}

            {/* ══ CITY DROPDOWN ════════════════════════════════════════ */}
            {showCityDropdown && (
                <CityDropdown
                    citySuggestions={citySuggestions}
                    onSelectCity={(shortLabel, item) => {
                        setCity(shortLabel);
                        setCityOpen(false);
                        navigate(query, shortLabel, radius, item.lat, item.lon);
                    }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface ServiceDropdownProps {
    filteredServices: string[];
    filteredCategories: typeof TOP_CATEGORIES;
    onSelectCategory: (label: string) => void;
    onSelectService: (item: string) => void;
}

function ServiceDropdown({
    filteredServices,
    filteredCategories,
    onSelectCategory,
    onSelectService,
}: ServiceDropdownProps) {
    return (
        <div className="absolute left-0 top-full z-[70] mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl antialiased transform-gpu">
            {/* "Все услуги" row */}
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectCategory('Все услуги')}
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
                                onClick={() => onSelectService(item)}
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
                                    onClick={() => onSelectCategory(cat.label)}
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
    );
}

interface CityDropdownProps {
    citySuggestions: NominatimSuggestion[];
    onSelectCity: (shortLabel: string, item: NominatimSuggestion) => void;
}

function CityDropdown({ citySuggestions, onSelectCity }: CityDropdownProps) {
    return (
        <div
            className="absolute top-full z-[70] mt-2 w-64 md:w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl antialiased transform-gpu"
            style={{ left: 'calc(100% - 256px - 104px)' }} /* align under city field */
        >
            <ul className="max-h-56 overflow-y-auto py-1">
                {citySuggestions.map((item, idx) => {
                    const parts = item.display_name.split(', ');
                    const shortLabel = parts.slice(0, 2).join(', ');

                    return (
                        <li key={idx}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onSelectCity(shortLabel, item)}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate">{shortLabel}</span>
                                    <span className="text-xs text-slate-400 truncate">{item.display_name}</span>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
