'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ChevronRight } from 'lucide-react';
import { LiveQuickSlots } from '@/components/search/LiveQuickSlots';
import { FavoriteButton } from '@/components/client/FavoriteButton';
import type { QuickSlotsResponse } from '@/app/actions/getQuickSlots';

interface SearchResultService {
    id: number;
    title: string;
    price: number;
    duration_min: number;
}

interface SearchResultListItemProps {
    profile: {
        id: number;
        slug: string;
        name: string;
        provider_type: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
        city: string;
        address?: string | null;
        image_url?: string | null;
        services: SearchResultService[];
    };
    initialIsFavorited?: boolean;
    isHovered?: boolean;
    profileType?: 'FREELANCER' | 'SALON';
    prefetchedSlots?: QuickSlotsResponse | null;
    priority?: boolean;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || '';
}

export function SearchResultListItem({
    profile,
    initialIsFavorited = false,
    isHovered = false,
    profileType,
    prefetchedSlots,
    priority = false,
}: SearchResultListItemProps) {
    const isSalonView = (profileType ?? (profile.provider_type === 'SALON' ? 'SALON' : 'FREELANCER')) === 'SALON';
    const visibleAddress = profile.provider_type === 'SALON'
        ? [profile.address, profile.city].filter(Boolean).join(', ')
        : profile.city;
    const initials = getInitials(profile.name);

    const imageWrapperClass = isSalonView
        ? 'w-full sm:w-64 sm:min-w-[16rem] aspect-video'
        : 'w-full sm:w-44 sm:min-w-[11rem] aspect-[4/5]';

    const primaryService = profile.services[0];
    const profileHref = `/salon/${profile.slug}`;
    const titleSuffix = primaryService
        ? ` — ${primaryService.title} в ${profile.city}`
        : ` в ${profile.city}`;

    return (
        <article
            className={`group flex flex-col sm:flex-row bg-transparent gap-4 sm:gap-5 pb-8 mb-8 border-b border-gray-200/50 last:border-b-0 last:pb-0 last:mb-0 transition-opacity duration-300 ${
                isHovered ? 'opacity-95' : 'opacity-100'
            }`}
        >
            {/* ── Left: Photo ───────────────────────────────────── */}
            <div className={`relative shrink-0 overflow-hidden rounded-xl ${imageWrapperClass}`}>
                <Link href={profileHref} className="block h-full w-full" aria-label={`Открыть профиль ${profile.name}`}>
                    <FavoriteButton
                        providerProfileId={profile.id}
                        initialIsFavorited={initialIsFavorited}
                        variant="card"
                    />
                    {profile.image_url ? (
                        <Image
                            src={profile.image_url}
                            alt={`${profile.name} — мастер в ${profile.city}`}
                            fill
                            sizes={isSalonView ? '(max-width: 640px) 100vw, 16rem' : '(max-width: 640px) 100vw, 11rem'}
                            priority={priority}
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a2e25] via-[#0f1f18] to-[#0a1812]">
                            <span className="text-3xl font-serif font-medium tracking-wide text-[#C29F52]">
                                {initials || 'M'}
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            {/* ── Middle: Info ──────────────────────────────────── */}
            <div className="flex flex-col flex-grow min-w-0">
                {/* Name + rating */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link href={profileHref} className="block min-w-0">
                            <h2 className="truncate font-bold text-lg text-gray-900 leading-snug font-sans group-hover:text-stone-700 transition-colors">
                                {profile.name}
                                <span className="sr-only">{titleSuffix}</span>
                            </h2>
                        </Link>
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{visibleAddress}</span>
                        </p>
                    </div>
                    <div
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                        aria-label="Рейтинг 5.0"
                    >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        5.0
                    </div>
                </div>

                {/* Services 2x2 grid (transparent, flat) */}
                {profile.services.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4 w-full">
                        {profile.services.slice(0, 4).map((service) => (
                            <div key={service.id}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-sm text-gray-900 truncate">{service.title}</span>
                                    <span className="text-gray-400 text-xs shrink-0">• {service.duration_min} мин</span>
                                </div>
                                <LiveQuickSlots
                                    profileId={profile.id}
                                    slug={profile.slug}
                                    service={service}
                                    maxSlots={4}
                                    prefetchedSlots={prefetchedSlots}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* See other services CTA */}
                {profile.services.length > 4 && (
                    <div className="flex justify-end mt-3 w-full">
                        <Link
                            href={profileHref}
                            className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                        >
                            смотреть другие услуги <span className="text-lg leading-none">↗</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* ── Right: Price + CTA (grouped, vertically centered) ── */}
            {primaryService && (
                <Link
                    href={profileHref}
                    className="hidden sm:flex flex-col items-end justify-center shrink-0 w-28 border-l border-gray-300/50 pl-4 ml-2"
                    aria-label={`Открыть профиль ${profile.name}${titleSuffix}`}
                >
                    <span className="block text-[11px] uppercase tracking-wider text-stone-400">от</span>
                    <span className="block text-2xl font-bold text-gray-900 leading-none mt-0.5">
                        €{primaryService.price}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-0.5 text-sm font-medium text-yellow-700 hover:text-yellow-800 transition-colors">
                        В профиль
                        <ChevronRight className="h-4 w-4" />
                    </span>
                </Link>
            )}
        </article>
    );
}
