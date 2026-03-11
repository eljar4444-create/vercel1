'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, User, ChevronDown, ChevronUp } from 'lucide-react';
import { LiveQuickSlots } from '@/components/search/LiveQuickSlots';
import { FavoriteButton } from '@/components/client/FavoriteButton';

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
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || '';
}

export function SearchResultListItem({ profile, initialIsFavorited = false, isHovered = false }: SearchResultListItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isSalon = profile.provider_type === 'SALON';
    const visibleAddress = isSalon
        ? [profile.address, profile.city].filter(Boolean).join(', ')
        : profile.city;
    const initials = getInitials(profile.name);

    return (
        <article
            className={`overflow-hidden rounded-2xl bg-white relative transition-all duration-300 ${isHovered
                    ? 'shadow-[0_12px_40px_rgb(0,0,0,0.10)] -translate-y-1'
                    : 'shadow-[0_4px_20px_rgb(0,0,0,0.06)]'
                }`}
        >
            {/* ── Photo – top, full width ──────────────────────── */}
            <Link
                href={`/salon/${profile.slug}`}
                className="relative block w-full aspect-[4/3] overflow-hidden bg-stone-100 rounded-t-2xl"
                aria-label={`Открыть профиль ${profile.name}`}
            >
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
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-100">
                        {initials ? (
                            <span className="text-3xl font-bold text-stone-300">{initials}</span>
                        ) : (
                            <User size={48} className="text-stone-300" />
                        )}
                    </div>
                )}
            </Link>

            {/* ── Content ──────────────────────────────────────── */}
            <div className="p-5">
                {/* Name + rating */}
                <div className="flex items-start justify-between gap-2">
                    <Link href={`/salon/${profile.slug}`} className="block min-w-0">
                        <h2 className="font-serif-display truncate text-[15px] font-semibold leading-snug text-stone-800 transition-colors hover:text-stone-600">
                            {profile.name}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{visibleAddress}</span>
                        </p>
                    </Link>
                    <div
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                        aria-label="Рейтинг 5.0"
                    >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        5.0
                    </div>
                </div>

                {/* Services & Slots */}
                {profile.services.length > 0 && (
                    <div className="mt-4">
                        {(isExpanded ? profile.services : profile.services.slice(0, 3)).map((service) => (
                            <div key={service.id} className="border-b border-stone-100 last:border-0 pb-3 mb-3">
                                <div className="flex justify-between items-center text-sm font-medium text-stone-800 mb-1.5">
                                    <span className="truncate pr-2">{service.title}</span>
                                    <span className="shrink-0 text-stone-600">€{service.price}</span>
                                </div>
                                <LiveQuickSlots profileId={profile.id} slug={profile.slug} service={service} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Show More Button */}
                {profile.services.length > 3 && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsExpanded(!isExpanded);
                        }}
                        className="mt-1 w-full flex items-center justify-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors py-2"
                    >
                        {isExpanded ? 'Скрыть' : `Показать все услуги (еще ${profile.services.length - 3})`}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
                    </button>
                )}
            </div>
        </article>
    );
}
