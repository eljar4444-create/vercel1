'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingCTAProps {
    /** Profile slug for routing */
    slug: string;
    /** Provider type determines the booking flow */
    providerType: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    /** Service to book */
    serviceId?: number;
    /** Pre-selected staff (skips SpecialistSelector) */
    staffId?: string;
    /** Number of specialists offering this service (salon only) */
    specialistCount?: number;
    /** Custom label */
    label?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Called before navigation — return false to prevent */
    onBeforeBook?: () => boolean | void;
    /** Called when salon needs specialist selection (instead of navigation) */
    onSelectSpecialist?: (serviceId: number) => void;
    /** Additional CSS classes */
    className?: string;
}

// ── Size presets ──────────────────────────────────────────────────────────────

const sizeClasses = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-10 px-6 text-sm',
    lg: 'h-12 px-8 text-sm',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingCTA({
    slug,
    providerType,
    serviceId,
    staffId,
    specialistCount = 0,
    label = 'Записаться',
    size = 'md',
    onBeforeBook,
    onSelectSpecialist,
    className = '',
}: BookingCTAProps) {
    const router = useRouter();

    const handleClick = useCallback(() => {
        if (onBeforeBook) {
            const result = onBeforeBook();
            if (result === false) return;
        }

        const isSalon = providerType === 'SALON';
        const needsSpecialistSelection =
            isSalon && specialistCount > 1 && !staffId && serviceId;

        // Salon with multiple specialists: open SpecialistSelector instead of navigating
        if (needsSpecialistSelection && onSelectSpecialist && serviceId) {
            onSelectSpecialist(serviceId);
            return;
        }

        // Build booking URL
        const params = new URLSearchParams();
        if (serviceId) params.set('serviceId', String(serviceId));
        if (staffId) params.set('staffId', staffId);
        const query = params.toString();

        router.push(`/book/${slug}${query ? `?${query}` : ''}`);
    }, [slug, providerType, serviceId, staffId, specialistCount, onBeforeBook, onSelectSpecialist, router]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`rounded-full bg-booking-primary font-medium text-white shadow-soft-out transition-all hover:bg-booking-primaryHover active:scale-95 ${sizeClasses[size]} ${className}`}
        >
            {label}
        </button>
    );
}
