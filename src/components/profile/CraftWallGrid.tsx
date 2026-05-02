'use client';

import { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CraftPhoto {
    id: string;
    url: string;
    serviceId?: number | null;
    staffId?: string | null;
}

interface CraftWallGridProps {
    photos: CraftPhoto[];
    /** Responsive column override (default: auto 2→3→4) */
    columns?: 2 | 3 | 4;
    /** Max rows to show before "Show more" button (0 = show all) */
    maxInitialRows?: number;
    /** Called when a photo is tapped */
    onPhotoTap?: (photo: CraftPhoto, index: number) => void;
    /** Seed for deterministic shuffle (default: 0 = no shuffle) */
    shuffleSeed?: number;
}

// ── Deterministic shuffle ─────────────────────────────────────────────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    let s = seed;
    for (let i = result.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) | 0;
        const j = ((s >>> 0) % (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ── Shimmer placeholder ───────────────────────────────────────────────────────

function ShimmerPlaceholder() {
    return (
        <div className="aspect-square animate-pulse rounded-2xl bg-gradient-to-br from-booking-card to-booking-bg" />
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

const PHOTOS_PER_ROW_DEFAULT = 4; // desktop

export function CraftWallGrid({
    photos,
    columns,
    maxInitialRows = 0,
    onPhotoTap,
    shuffleSeed = 0,
}: CraftWallGridProps) {
    const t = useTranslations('salon');
    const shuffled = useMemo(
        () => (shuffleSeed ? seededShuffle(photos, shuffleSeed) : photos),
        [photos, shuffleSeed]
    );

    const colCount = columns ?? PHOTOS_PER_ROW_DEFAULT;
    const initialCount = maxInitialRows > 0 ? maxInitialRows * colCount : shuffled.length;
    const [visibleCount, setVisibleCount] = useState(initialCount);
    const visiblePhotos = shuffled.slice(0, visibleCount);
    const hasMore = visibleCount < shuffled.length;

    const showMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + colCount * 2, shuffled.length));
    }, [colCount, shuffled.length]);

    if (shuffled.length === 0) return null;

    const gridCols =
        columns === 2
            ? 'grid-cols-2'
            : columns === 3
              ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

    return (
        <div>
            <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
                {visiblePhotos.map((photo, idx) => (
                    <button
                        key={photo.id}
                        type="button"
                        onClick={() => onPhotoTap?.(photo, idx)}
                        className="group relative aspect-square overflow-hidden rounded-2xl bg-booking-card shadow-soft-out transition-transform duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-booking-primary focus-visible:ring-offset-2"
                        aria-label={t('modals.craftWall.photoAria', { number: idx + 1 })}
                    >
                        <Image
                            src={photo.url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            loading={idx < 8 ? 'eager' : 'lazy'}
                        />
                        {/* Hover overlay */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </button>
                ))}
            </div>

            {hasMore && (
                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        onClick={showMore}
                        className="rounded-full border border-booking-border bg-booking-card px-6 py-2.5 text-sm font-medium text-booking-textMain shadow-soft-out transition-all hover:bg-booking-bg hover:shadow-soft-in active:scale-95"
                    >
                        {t('modals.craftWall.showMore')}
                    </button>
                </div>
            )}
        </div>
    );
}
