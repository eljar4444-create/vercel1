'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { X, Star, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpecialistOption {
    id: string;
    name: string;
    avatarUrl?: string | null;
    specialty?: string | null;
    rating?: number;
    reviewCount?: number;
    nearestSlot?: string | null;
    photoCount?: number;
}

interface SpecialistSelectorProps {
    open: boolean;
    onClose: () => void;
    /** Service title for context */
    serviceTitle: string;
    /** Available specialists for this service */
    specialists: SpecialistOption[];
    /** Called when a specialist is selected */
    onSelect: (specialistId: string | null) => void;
    /** Pre-selected specialist (e.g., from watermarked photo) */
    preSelectedId?: string | null;
}

// ── Animations ────────────────────────────────────────────────────────────────

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
} as const;

const panelVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 280 } },
    exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SpecialistSelector({
    open,
    onClose,
    serviceTitle,
    specialists,
    onSelect,
    preSelectedId,
}: SpecialistSelectorProps) {
    const t = useTranslations('salon');
    const handleSelect = useCallback(
        (id: string | null) => {
            onSelect(id);
            onClose();
        },
        [onSelect, onClose]
    );

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    aria-modal="true"
                    role="dialog"
                    aria-label={t('modals.specialistSelector.dialogLabel')}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl bg-booking-bg/95 shadow-2xl backdrop-blur-lg sm:mx-4 sm:rounded-3xl"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-booking-border/50 px-6 py-4">
                            <div>
                                <h2 className="font-serif text-lg font-semibold text-booking-textMain">
                                    {t('modals.specialistSelector.title')}
                                </h2>
                                <p className="mt-0.5 text-xs text-booking-textMuted">{serviceTitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-booking-card text-booking-textMuted transition-colors hover:bg-booking-border"
                                aria-label={t('modals.close')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Specialist list */}
                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                            {specialists.map((spec) => (
                                <button
                                    key={spec.id}
                                    type="button"
                                    onClick={() => handleSelect(spec.id)}
                                    className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all ${
                                        preSelectedId === spec.id
                                            ? 'bg-booking-primary/10 ring-2 ring-booking-primary'
                                            : 'bg-booking-card shadow-soft-out hover:bg-booking-bg hover:shadow-soft-in'
                                    }`}
                                >
                                    {/* Avatar */}
                                    {spec.avatarUrl ? (
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                                            <Image
                                                src={spec.avatarUrl}
                                                alt={spec.name}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-booking-border text-sm font-semibold text-booking-textMuted">
                                            {getInitials(spec.name)}
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-booking-textMain truncate">
                                            {spec.name}
                                        </p>
                                        {spec.specialty && (
                                            <p className="text-xs text-booking-textMuted truncate">
                                                {spec.specialty}
                                            </p>
                                        )}
                                        <div className="mt-1 flex items-center gap-3">
                                            {spec.rating !== undefined && (
                                                <span className="inline-flex items-center gap-1 text-xs text-booking-textMuted">
                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    {spec.rating.toFixed(1)}
                                                    {spec.reviewCount !== undefined && (
                                                        <span className="text-booking-textMuted/60">
                                                            ({spec.reviewCount})
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            {spec.nearestSlot && (
                                                <span className="inline-flex items-center gap-1 text-xs text-booking-primary">
                                                    <Clock className="h-3 w-3" />
                                                    {spec.nearestSlot}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div className="shrink-0 text-booking-textMuted/40">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}

                            {/* Any available option */}
                            <button
                                type="button"
                                onClick={() => handleSelect(null)}
                                className="flex w-full items-center gap-4 rounded-2xl bg-booking-card p-4 text-left shadow-soft-out transition-all hover:bg-booking-bg hover:shadow-soft-in"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-booking-primary/10 text-booking-primary">
                                    <Star className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-booking-textMain">
                                        {t('modals.specialistSelector.anyAvailable')}
                                    </p>
                                    <p className="text-xs text-booking-textMuted">
                                        {t('modals.specialistSelector.anyAvailableHint')}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
