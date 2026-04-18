'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Clock, Camera } from 'lucide-react';
import { DeepDiveModal, type DeepDivePhoto } from './DeepDiveModal';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ServicePhoto {
    id: string;
    url: string;
    staffId?: string | null;
}

export interface ServiceStaff {
    id: string;
    name: string;
    avatarUrl?: string | null;
}

export interface ServiceItem {
    id: number;
    title: string;
    description?: string | null;
    price: string | number;
    duration_min: number;
    photos: ServicePhoto[];
    /** Which specialists offer this service (salon only) */
    staff?: ServiceStaff[];
}

interface ServiceMenuProps {
    services: ServiceItem[];
    /** Called when "Выбрать" / booking CTA is clicked */
    onBook: (service: ServiceItem) => void;
    /** Whether to show specialist names per service (salon mode) */
    showSpecialistNames?: boolean;
    /** Provider name for alt text */
    providerName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: string | number) {
    const n = Number(price);
    return n === 0 ? 'по договорённости' : `€${n.toFixed(0)}`;
}

function formatDuration(min: number) {
    return min === 0 ? 'по договорённости' : `${min} мин`;
}

function pluralPhotos(n: number) {
    if (n === 1) return '1 фото';
    return `${n} фото`;
}

// ── ServiceMenuRow ────────────────────────────────────────────────────────────

function ServiceMenuRow({
    service,
    onBook,
    showSpecialistNames,
    onSeePhotos,
}: {
    service: ServiceItem;
    onBook: () => void;
    showSpecialistNames?: boolean;
    onSeePhotos: () => void;
}) {
    const coverPhoto = service.photos[0] ?? null;
    const extraCount = service.photos.length - 1;

    return (
        <div className="py-4 first:pt-0">
            <div className="flex items-start gap-4">
                {/* Cover photo thumbnail */}
                {coverPhoto && (
                    <button
                        type="button"
                        onClick={onSeePhotos}
                        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-booking-card shadow-soft-out transition-transform hover:scale-105"
                    >
                        <Image
                            src={coverPhoto.url}
                            alt={service.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                        {extraCount > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                                <Camera className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </button>
                )}

                {/* Service info */}
                <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-semibold text-booking-textMain truncate">
                        {service.title}
                    </p>
                    {service.description && (
                        <p className="mt-0.5 text-xs text-booking-textMuted truncate">
                            {service.description}
                        </p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-booking-textMuted">
                            <Clock className="h-3 w-3" />
                            {formatDuration(service.duration_min)}
                        </span>
                        {showSpecialistNames && service.staff && service.staff.length > 0 && (
                            <span className="text-xs text-booking-textMuted">
                                {service.staff.map((s) => s.name).join(', ')}
                            </span>
                        )}
                    </div>
                    {extraCount > 0 && (
                        <button
                            type="button"
                            onClick={onSeePhotos}
                            className="mt-1 text-xs font-medium text-booking-primary underline underline-offset-2 transition hover:text-booking-primaryHover"
                        >
                            Ещё {pluralPhotos(extraCount)}
                        </button>
                    )}
                </div>

                {/* Price + CTA */}
                <div className="flex shrink-0 items-center gap-3">
                    <span className="text-base font-semibold tabular-nums text-booking-textMain">
                        {formatPrice(service.price)}
                    </span>
                    <button
                        type="button"
                        onClick={onBook}
                        className="h-9 rounded-full bg-booking-card px-4 text-xs font-medium text-booking-textMain shadow-soft-out transition-all hover:bg-booking-bg hover:shadow-soft-in active:scale-95"
                    >
                        Выбрать
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── ServiceMenu ───────────────────────────────────────────────────────────────

export function ServiceMenu({
    services,
    onBook,
    showSpecialistNames = false,
    providerName,
}: ServiceMenuProps) {
    const [deepDiveService, setDeepDiveService] = useState<ServiceItem | null>(null);

    const handleSeePhotos = useCallback((service: ServiceItem) => {
        if (service.photos.length > 0) {
            setDeepDiveService(service);
        }
    }, []);

    const closeDeepDive = useCallback(() => {
        setDeepDiveService(null);
    }, []);

    const deepDivePhotos: DeepDivePhoto[] = (deepDiveService?.photos ?? []).map((p) => ({
        id: p.id,
        url: p.url,
        serviceId: deepDiveService?.id ?? null,
        staffId: p.staffId ?? null,
        specialistBadge: null,
    }));

    if (services.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-booking-textMuted">Список услуг пока пуст.</p>
            </div>
        );
    }

    return (
        <>
            <div className="divide-y divide-booking-border/50">
                {services.map((service) => (
                    <ServiceMenuRow
                        key={service.id}
                        service={service}
                        onBook={() => onBook(service)}
                        showSpecialistNames={showSpecialistNames}
                        onSeePhotos={() => handleSeePhotos(service)}
                    />
                ))}
            </div>

            {/* DeepDive modal for "See N more photos" */}
            <DeepDiveModal
                open={deepDiveService !== null}
                onClose={closeDeepDive}
                title={deepDiveService?.title ?? ''}
                photos={deepDivePhotos}
            />
        </>
    );
}
