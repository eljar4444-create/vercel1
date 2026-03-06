'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { SearchResultListItem } from '@/components/search/SearchResultListItem';
import { SearchResultsMap } from '@/components/search/SearchResultsMap';

interface SearchInteractiveLayoutProps {
    profiles: any[];
    mapMarkers: any[];
    favoriteIds: number[];
    headerContent: ReactNode;
}

export function SearchInteractiveLayout({
    profiles,
    mapMarkers,
    favoriteIds,
    headerContent,
}: SearchInteractiveLayoutProps) {
    const [hoveredMasterId, setHoveredMasterId] = useState<number | null>(null);
    const favoriteSet = new Set(favoriteIds);

    return (
        <div className="flex h-full flex-col lg:flex-row">
            <div className="h-full w-full overflow-y-auto bg-[#fbfbfb] p-4 pb-24 md:p-5 lg:w-[48%] xl:w-[46%]">
                {headerContent}

                {profiles.length > 0 ? (
                    <div>
                        {profiles.map((profile: any) => (
                            <div
                                key={profile.id}
                                onMouseEnter={() => setHoveredMasterId(profile.id)}
                                onMouseLeave={() => setHoveredMasterId(null)}
                            >
                                <SearchResultListItem
                                    profile={profile}
                                    initialIsFavorited={favoriteSet.has(profile.id)}
                                    isHovered={hoveredMasterId === profile.id}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                        <h2 className="text-lg font-semibold text-slate-900">Специалисты не найдены</h2>
                        <p className="mt-2 text-sm text-slate-500">Попробуйте изменить запрос или город.</p>
                        <Link
                            href="/search"
                            className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Сбросить фильтры
                        </Link>
                    </div>
                )}
            </div>

            <aside className="relative hidden h-full border-l border-slate-200 bg-slate-100 lg:block lg:w-[52%] xl:w-[54%]">
                <SearchResultsMap markers={mapMarkers} hoveredMarkerId={hoveredMasterId} />
            </aside>
        </div>
    );
}
