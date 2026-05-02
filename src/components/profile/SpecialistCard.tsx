'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DeepDiveModal, type DeepDivePhoto } from './DeepDiveModal';

export interface SpecialistCardProps {
    id: string;
    name: string;
    avatarUrl?: string | null;
    specialty?: string | null;
    rating?: number;
    reviewCount?: number;
    photos: DeepDivePhoto[];
}

export function SpecialistCard({
    id,
    name,
    avatarUrl,
    specialty,
    rating,
    reviewCount,
    photos,
}: SpecialistCardProps) {
    const t = useTranslations('salon');
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

    const openDeepDive = useCallback(() => setIsDeepDiveOpen(true), []);
    const closeDeepDive = useCallback(() => setIsDeepDiveOpen(false), []);

    return (
        <>
            <div className="flex flex-col items-center bg-booking-card rounded-2xl p-4 shadow-soft-out">
                {/* Avatar */}
                <div className="relative h-20 w-20 mb-3 overflow-hidden rounded-full border border-booking-border">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-booking-bg text-xl font-serif font-medium text-booking-textMuted uppercase">
                            {name.slice(0, 2)}
                        </div>
                    )}
                </div>

                {/* Info */}
                <h3 className="font-serif text-base font-semibold text-booking-textMain text-center mb-1 truncate w-full">
                    {name}
                </h3>

                {specialty && (
                    <p className="text-xs text-booking-textMuted text-center mb-2 truncate w-full">
                        {specialty}
                    </p>
                )}

                {rating !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-booking-textMuted mb-3">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{rating.toFixed(1)}</span>
                        {reviewCount !== undefined && (
                            <span className="opacity-60">({reviewCount})</span>
                        )}
                    </div>
                )}

                {/* Photos Link */}
                {photos.length > 0 ? (
                    <button
                        type="button"
                        onClick={openDeepDive}
                        className="mt-auto text-xs font-medium text-booking-primary underline underline-offset-2 transition hover:text-booking-primaryHover"
                    >
                        {t('service.photosPlural', { count: photos.length })}
                    </button>
                ) : (
                    <div className="mt-auto items-center justify-center h-4">
                        <span className="text-xs text-booking-textMuted opacity-0">...</span>
                    </div>
                )}
            </div>

            {/* DeepDive modal for specialist's photos */}
            {photos.length > 0 && (
                <DeepDiveModal
                    open={isDeepDiveOpen}
                    onClose={closeDeepDive}
                    title={t('gallery.portfolioAlt', { name })}
                    photos={photos}
                />
            )}
        </>
    );
}
