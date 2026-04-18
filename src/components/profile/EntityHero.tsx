'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { BookingCTA } from './BookingCTA';

export interface EntityHeroProps {
    providerType: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    name: string;
    slug: string;
    avatarUrl?: string | null;
    bioOrDescription?: string | null;
    city: string;
    address?: string | null;
    outcallRadiusKm?: number | null;
    interiorPhotos?: string[];
}

export function EntityHero({
    providerType,
    name,
    slug,
    avatarUrl,
    bioOrDescription,
    city,
    address,
    outcallRadiusKm,
    interiorPhotos = [],
}: EntityHeroProps) {
    const isPrivate = providerType !== 'SALON';

    if (isPrivate) {
        return (
            <div className="relative flex flex-col items-center pt-8 pb-6 px-4 text-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-booking-border shadow-soft-out mb-4 bg-booking-card">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="80px"
                            priority
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-serif font-medium text-booking-textMuted uppercase">
                            {name.slice(0, 2)}
                        </div>
                    )}
                </div>

                <h1 className="font-serif text-3xl font-semibold text-booking-textMain mb-2">
                    {name}
                </h1>

                {bioOrDescription && (
                    <p className="text-booking-textMain text-sm max-w-md mx-auto mb-3">
                        {bioOrDescription}
                    </p>
                )}

                <div className="flex items-center text-xs text-booking-textMuted justify-center gap-1 mb-6">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{city}</span>
                    {outcallRadiusKm && (
                        <span>• Выезд до {outcallRadiusKm} км</span>
                    )}
                </div>

                <div className="sticky top-4 z-20">
                    <BookingCTA
                        slug={slug}
                        providerType={providerType}
                        size="md"
                        className="w-full sm:w-auto min-w-[200px]"
                    />
                </div>
            </div>
        );
    }

    // Salon Variant
    return (
        <div className="pt-8 pb-8 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-booking-border shadow-soft-out bg-booking-card">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="96px"
                            priority
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-serif font-medium text-booking-textMuted uppercase">
                            {name.slice(0, 2)}
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="font-serif text-3xl font-semibold text-booking-textMain mb-2">
                        {name}
                    </h1>
                    
                    <div className="flex items-start text-sm text-booking-textMuted gap-1.5 mb-3">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                            {address ? `${address}, ` : ''}{city}
                        </span>
                    </div>

                    {bioOrDescription && (
                        <p className="text-sm text-booking-textMain max-w-2xl leading-relaxed">
                            {bioOrDescription}
                        </p>
                    )}
                </div>
            </div>

            {interiorPhotos.length > 0 && (
                <div className="mt-8">
                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
                        {interiorPhotos.map((url, i) => (
                            <div 
                                key={i} 
                                className="relative h-48 w-72 shrink-0 overflow-hidden rounded-2xl shadow-soft-out snap-center bg-booking-card"
                            >
                                <Image
                                    src={url}
                                    alt={`Интерьер салона ${name} ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 288px, 288px"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
