export const dynamic = 'force-dynamic';
export const revalidate = 0;

import prisma from "@/lib/prisma";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { SearchFiltersForm } from "@/components/search/SearchFiltersForm";
import { getCityFilterVariants } from "@/constants/searchSuggestions";
import { GERMAN_CITIES } from "@/constants/germanCities";
import { SearchResultListItem } from "@/components/search/SearchResultListItem";
import { SearchResultsMap } from "@/components/search/SearchResultsMap";

const QUICK_FILTERS = ['Рядом со мной', 'Топ рейтинг', 'Стрижка', 'Маникюр', 'Массаж'];

const DEFAULT_CITY_COORDS = {
    lat: 52.52,
    lng: 13.405,
};

function resolveCityCoordinates(city: string) {
    const normalized = city.trim().toLowerCase();
    const match = GERMAN_CITIES.find((entry) =>
        entry.names.some((name: string) => normalized.includes(name.toLowerCase()))
    );

    if (!match) return DEFAULT_CITY_COORDS;
    return {
        lat: Number(match.data.lat) || DEFAULT_CITY_COORDS.lat,
        lng: Number(match.data.lon) || DEFAULT_CITY_COORDS.lng,
    };
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const cityFilter = typeof searchParams.city === 'string' ? searchParams.city : undefined;
    const queryFilter = typeof searchParams.q === 'string' ? searchParams.q : undefined;

    const andConditions: any[] = [{ is_verified: true }, { category: { slug: { not: 'health' } } }];

    if (categoryFilter && categoryFilter !== 'health') {
        andConditions.push({ category: { slug: categoryFilter } });
    }

    if (cityFilter) {
        const cityVariants = getCityFilterVariants(cityFilter);
        andConditions.push({
            OR: cityVariants.map((variant) => ({
                city: { contains: variant, mode: 'insensitive' },
            })),
        });
    }

    if (queryFilter) {
        andConditions.push({
            OR: [
                { name: { contains: queryFilter, mode: 'insensitive' } },
                { city: { contains: queryFilter, mode: 'insensitive' } },
                { category: { name: { contains: queryFilter, mode: 'insensitive' } } },
                {
                    services: {
                        some: {
                            title: { contains: queryFilter, mode: 'insensitive' },
                        },
                    },
                },
            ],
        });
    }

    const where: any = { AND: andConditions };

    let profiles: any[] = [];
    try {
        profiles = await prisma.profile.findMany({
            where,
            include: {
                category: true,
                services: true,
            },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
    } catch (e: any) {
        console.error("DB Error:", e);
    }

    const mapMarkers = profiles.map((profile) => {
        const coords = resolveCityCoordinates(profile.city || '');
        return {
            id: profile.id,
            name: profile.name,
            city: profile.city,
            address: profile.address,
            lat: coords.lat,
            lng: coords.lng,
        };
    });

    return (
        <div className="h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="mx-auto max-w-7xl">
                    <SearchFiltersForm
                        categoryFilter={categoryFilter}
                        queryFilter={queryFilter}
                        cityFilter={cityFilter}
                    />
                </div>
            </div>

            <div className="flex h-[calc(100%-76px)] flex-col lg:flex-row">
                <div className="h-full w-full overflow-y-auto p-4 pb-24 md:p-6 lg:w-[55%] xl:w-[60%]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h1 className="text-xl font-semibold text-slate-900">
                            {profiles.length > 0
                                ? `Найдено ${profiles.length} специалистов`
                                : 'Специалисты не найдены'}
                        </h1>
                        <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-800">
                            На главную
                        </Link>
                    </div>

                    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                        {QUICK_FILTERS.map((filter) => {
                            const params = new URLSearchParams();
                            if (cityFilter) params.set('city', cityFilter);
                            if (filter === 'Рядом со мной') {
                                if (queryFilter) params.set('q', queryFilter);
                            } else if (filter === 'Топ рейтинг') {
                                params.set('sort', 'rating');
                                if (queryFilter) params.set('q', queryFilter);
                            } else {
                                params.set('q', filter);
                            }
                            return (
                                <Link
                                    key={filter}
                                    href={`/search?${params.toString()}`}
                                    className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                    {filter}
                                </Link>
                            );
                        })}
                    </div>

                    {(cityFilter || queryFilter) && (
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            {cityFilter && (
                                <Link
                                    href={`/search${queryFilter ? `?q=${encodeURIComponent(queryFilter)}` : ''}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                    {cityFilter}
                                    <X className="h-3 w-3" />
                                </Link>
                            )}
                            {queryFilter && (
                                <Link
                                    href={`/search${cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : ''}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
                                >
                                    <Search className="h-3 w-3" />
                                    {queryFilter}
                                    <X className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    )}

                    {profiles.length > 0 ? (
                        <div>
                            {profiles.map((profile: any) => (
                                <SearchResultListItem
                                    key={profile.id}
                                    profile={{
                                        id: profile.id,
                                        name: profile.name,
                                        city: profile.city,
                                        address: profile.address,
                                        image_url: profile.image_url,
                                        services: (profile.services || []).map((service: any) => ({
                                            id: service.id,
                                            title: service.title,
                                            price: Number(service.price),
                                            duration_min: service.duration_min,
                                        })),
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                            <h3 className="text-lg font-semibold text-slate-900">Специалисты не найдены</h3>
                            <p className="mt-2 text-sm text-slate-500">Попробуйте изменить запрос или город.</p>
                            <Link
                                href="/search"
                                className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Сбросить фильтры
                            </Link>
                        </div>
                    )}
                </div>

                <aside className="relative hidden h-full bg-slate-100 lg:block lg:w-[45%] xl:w-[40%]">
                    <SearchResultsMap markers={mapMarkers} />
                </aside>
            </div>
        </div>
    );
}
