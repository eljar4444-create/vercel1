'use client';

import React, { useState, useEffect, useCallback, useRef, ReactNode, Suspense, useTransition } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchResultListItem } from '@/components/search/SearchResultListItem';
import type { MapBounds } from '@/components/search/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const SearchResultsMap = dynamic(
    () => import('@/components/search/SearchResultsMap').then((mod) => mod.SearchResultsMap),
    {
        ssr: false,
        loading: () => <Skeleton className="h-full min-h-[300px] w-full rounded-3xl" />,
    }
);

/** Catches React rendering errors inside the map without crashing the entire page. */
class MapErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error) {
        console.error('[MapErrorBoundary]', error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-full w-full items-center justify-center rounded-3xl bg-stone-50 text-sm text-stone-400">
                    Карта временно недоступна
                </div>
            );
        }
        return this.props.children;
    }
}

interface SearchInteractiveLayoutProps {
    initialProfiles: any[];
    initialMapMarkers: any[];
    favoriteIds: number[];
    headerContent: ReactNode;
    initialCenter?: [number, number];
    initialZoom?: number;
    radiusKm?: number;
}

function ProfileCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.06)]">
            <Skeleton className="aspect-[4/3] w-full rounded-t-2xl" />
            <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-36 bg-stone-100" />
                <Skeleton className="h-3 w-24 bg-stone-100" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full bg-stone-100" />
                    <Skeleton className="h-6 w-20 rounded-full bg-stone-100" />
                </div>
                <Skeleton className="h-3 w-16 bg-stone-100" />
            </div>
        </div>
    );
}

export function SearchInteractiveLayout({
    initialProfiles,
    initialMapMarkers,
    favoriteIds,
    headerContent,
    initialCenter,
    initialZoom,
    radiusKm,
}: SearchInteractiveLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [profiles, setProfiles] = useState<any[]>(initialProfiles);
    const [mapMarkers, setMapMarkers] = useState<any[]>(initialMapMarkers);
    const [hoveredMasterId, setHoveredMasterId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [bounds, setBounds] = useState<MapBounds | null>(null);
    const [resultCount, setResultCount] = useState<number>(initialProfiles.length);
    const [profileType, setProfileType] = useState<'FREELANCER' | 'SALON'>('FREELANCER');

    const filteredProfiles = profiles.filter((p: any) =>
        profileType === 'SALON' ? p.provider_type === 'SALON' : p.provider_type !== 'SALON'
    );

    // Russian pluralization: 1 салон, 2 салона, 5 салонов
    const pluralize = (n: number, forms: [string, string, string]) => {
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return forms[0];
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
        return forms[2];
    };

    const resultsLabel = profileType === 'SALON'
        ? pluralize(filteredProfiles.length, ['салон', 'салона', 'салонов'])
        : pluralize(filteredProfiles.length, ['специалист', 'специалиста', 'специалистов']);

    const favoriteSet = new Set(favoriteIds);

    const debouncedBounds = useDebounce(bounds, 400);

    // Keep local state in sync with server-provided initial data
    useEffect(() => {
        if (!debouncedBounds) {
            setProfiles(initialProfiles);
            setMapMarkers(initialMapMarkers);
            setResultCount(initialProfiles.length);
        }
    }, [initialProfiles, initialMapMarkers, debouncedBounds]);

    // Fetch providers when debounced bounds or search params change
    useEffect(() => {
        if (!debouncedBounds) return;

        const controller = new AbortController();

        const fetchProviders = async () => {
            const RADIUS_OPTIONS = [5, 10, 20, 50]; // '2' is not present in the array, so removing it results in the same array.
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    minLat: debouncedBounds.minLat.toString(),
                    maxLat: debouncedBounds.maxLat.toString(),
                    minLng: debouncedBounds.minLng.toString(),
                    maxLng: debouncedBounds.maxLng.toString(),
                });

                // Preserve active URL filters when re-fetching providers for current map bounds
                const passthroughKeys = [
                    'q',
                    'category',
                    'sort',
                    'today',
                    'homeVisit',
                    'promo',
                    'inSalon',
                    'cardPayment',
                    'instantBooking',
                    'language',
                ];

                passthroughKeys.forEach((key) => {
                    const value = searchParams.get(key);
                    if (value) {
                        params.set(key, value);
                    }
                });

                const res = await fetch(`/api/search/providers?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Fetch failed');
                const data = await res.json();

                const providers: any[] = data.providers || [];

                setProfiles(providers.map((p: any) => ({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    provider_type: p.provider_type,
                    city: p.city,
                    address: p.address,
                    image_url: p.image_url,
                    services: p.services || [],
                })));

                setMapMarkers(providers.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    provider_type: p.provider_type,
                    city: p.city,
                    address: p.address,
                    lat: p.latitude,
                    lng: p.longitude,
                    image: p.image_url,
                    slug: p.slug,
                })));

                setResultCount(providers.length);

                // Update URL params silently for shareability
                const urlParams = new URLSearchParams(searchParams.toString());
                urlParams.set('minLat', debouncedBounds.minLat.toFixed(6));
                urlParams.set('maxLat', debouncedBounds.maxLat.toFixed(6));
                urlParams.set('minLng', debouncedBounds.minLng.toFixed(6));
                urlParams.set('maxLng', debouncedBounds.maxLng.toFixed(6));

                // Keep the radius if the map moved programmatically (i.e. to fit the new radius).
                // Only clear the radius if the user manually dragged/zoomed the map, breaking the constraints.
                if (debouncedBounds.source !== 'programmatic') {
                    urlParams.delete('lat');
                    urlParams.delete('lng');
                    urlParams.delete('radius');
                }

                startTransition(() => {
                    router.replace(`${pathname}?${urlParams.toString()}`, { scroll: false });
                });
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.error('[SearchInteractiveLayout] Fetch error:', e);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProviders();
        return () => controller.abort();
    }, [debouncedBounds, pathname, router, searchParams]); // Re-run when filters in URL change

    const handleBoundsChange = useCallback((newBounds: MapBounds) => {
        setBounds(newBounds);
    }, []);

    return (
        <div className="flex h-full min-h-0 flex-col lg:flex-row">
            <div className="relative z-10 h-full min-h-0 w-full overflow-y-auto bg-transparent p-4 pb-12 shadow-[20px_0_30px_-15px_rgba(0,0,0,0.05)] md:p-6 lg:w-[48%] xl:w-[46%]">
                {/* Header with dynamic result count */}
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-stone-800 font-sans">
                        {isLoading
                            ? 'Поиск специалистов…'
                            : filteredProfiles.length > 0
                                ? `Найдено ${filteredProfiles.length} ${resultsLabel}`
                                : profileType === 'SALON' ? 'Салоны не найдены' : 'Специалисты не найдены'}
                    </h1>
                    <Link href="/" className="text-sm text-stone-500 transition hover:text-stone-800">
                        На главную
                    </Link>
                </div>

                {/* Freelancer / Salon toggle */}
                <div className="mb-4 inline-flex rounded-full bg-stone-100 p-1 text-sm font-medium">
                    <button
                        type="button"
                        onClick={() => setProfileType('FREELANCER')}
                        className={cn(
                            'px-4 py-1.5 rounded-full transition-colors',
                            profileType === 'FREELANCER'
                                ? 'bg-white text-stone-900 shadow-sm'
                                : 'text-stone-500 hover:text-stone-700'
                        )}
                    >
                        Частные мастера
                    </button>
                    <button
                        type="button"
                        onClick={() => setProfileType('SALON')}
                        className={cn(
                            'px-4 py-1.5 rounded-full transition-colors',
                            profileType === 'SALON'
                                ? 'bg-white text-stone-900 shadow-sm'
                                : 'text-stone-500 hover:text-stone-700'
                        )}
                    >
                        Салоны
                    </button>
                </div>

                <Suspense fallback={<div className="h-10" />}>
                    {headerContent}
                </Suspense>

                {isLoading && profiles.length === 0 ? (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-start">
                        {[1, 2, 3, 4].map((i) => (
                            <ProfileCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div 
                        className={cn(
                            "transition-opacity duration-300",
                            (isLoading || isPending) ? "opacity-50 pointer-events-none" : "opacity-100"
                        )}
                    >
                        {filteredProfiles.length > 0 ? (
                            <div className="flex flex-col gap-4 w-full">
                                {filteredProfiles.map((profile: any) => (
                                    <div
                                        key={profile.id}
                                        onMouseEnter={() => setHoveredMasterId(profile.id)}
                                        onMouseLeave={() => setHoveredMasterId(null)}
                                    >
                                        <SearchResultListItem
                                            profile={profile}
                                            initialIsFavorited={favoriteSet.has(profile.id)}
                                            isHovered={hoveredMasterId === profile.id}
                                            profileType={profileType}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <h2 className="text-xl font-semibold text-stone-800 font-sans">Специалисты не найдены</h2>
                                <p className="mt-2 text-sm text-stone-500">Попробуйте сдвинуть карту или изменить запрос.</p>
                                <Link
                                    href="/search"
                                    className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                                >
                                    Сбросить фильтры
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <aside className="relative hidden h-full p-4 lg:flex lg:w-[52%] xl:w-[54%] lg:items-stretch">
                <div className="h-full w-full overflow-hidden rounded-3xl border border-stone-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.08)] filter grayscale-[0.3] sepia-[0.1] contrast-[0.9] opacity-90">
                    <MapErrorBoundary>
                        <SearchResultsMap
                            markers={mapMarkers}
                            hoveredMarkerId={hoveredMasterId}
                            onBoundsChange={handleBoundsChange}
                            initialCenter={initialCenter}
                            initialZoom={initialZoom}
                            radiusKm={radiusKm}
                        />
                    </MapErrorBoundary>
                </div>
            </aside>
        </div>
    );
}
