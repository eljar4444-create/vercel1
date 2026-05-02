'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    ManualBookingModal,
    type ManualBookingService,
    type ManualBookingStaff,
} from './ManualBookingModal';

interface ManualBookingTriggerProps {
    profileId: number;
    services: ManualBookingService[];
    staff: ManualBookingStaff[];
}

export function ManualBookingTrigger({
    profileId,
    services,
    staff,
}: ManualBookingTriggerProps) {
    const t = useTranslations('dashboard.provider.manualBooking');
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
                <Plus className="h-4 w-4" />
                {t('newBooking')}
            </button>
            <ManualBookingModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                profileId={profileId}
                services={services}
                staff={staff}
            />
        </>
    );
}
