'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CraftWallGrid, type CraftPhoto } from './CraftWallGrid';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpecialistBadge {
    name: string;
    avatarUrl?: string | null;
}

export interface DeepDivePhoto extends CraftPhoto {
    specialistBadge?: SpecialistBadge | null;
}

interface DeepDiveModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Title shown in the modal header */
    title: string;
    /** Photos to display */
    photos: DeepDivePhoto[];
    /** If set, opens directly in lightbox mode at this photo index */
    initialPhotoIndex?: number | null;
    /** Show specialist badge on each photo in the grid */
    showSpecialistBadge?: boolean;
    /** CTA label for lightbox view */
    ctaLabel?: string;
    /** CTA callback with the current photo */
    onCtaClick?: (photo: DeepDivePhoto) => void;
}

// ── Backdrop + Panel animations ───────────────────────────────────────────────

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
} as const;

const panelVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
    exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.2 } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DeepDiveModal({
    open,
    onClose,
    title,
    photos,
    initialPhotoIndex = null,
    showSpecialistBadge = false,
    ctaLabel = 'Записаться',
    onCtaClick,
}: DeepDiveModalProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(initialPhotoIndex);

    // Reset lightbox when modal opens/closes
    useEffect(() => {
        if (open) {
            setLightboxIndex(initialPhotoIndex);
        }
    }, [open, initialPhotoIndex]);

    // Lock body scroll when open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (lightboxIndex !== null) {
                    setLightboxIndex(null);
                } else {
                    onClose();
                }
            }
            if (lightboxIndex !== null) {
                if (e.key === 'ArrowLeft') {
                    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
                }
                if (e.key === 'ArrowRight') {
                    setLightboxIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, lightboxIndex, photos.length, onClose]);

    const handlePhotoTap = useCallback((_: CraftPhoto, index: number) => {
        setLightboxIndex(index);
    }, []);

    const goToPrev = useCallback(() => {
        setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
    }, [photos.length]);

    const goToNext = useCallback(() => {
        setLightboxIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
    }, [photos.length]);

    const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    aria-modal="true"
                    role="dialog"
                    aria-label={title}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => {
                            if (lightboxIndex !== null) {
                                setLightboxIndex(null);
                            } else {
                                onClose();
                            }
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-booking-bg/95 shadow-2xl backdrop-blur-lg mx-4"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-booking-border/50 px-6 py-4">
                            <div>
                                <h2 className="font-serif text-xl font-semibold text-booking-textMain">
                                    {title}
                                </h2>
                                <p className="mt-0.5 text-xs text-booking-textMuted">
                                    {photos.length} {photos.length === 1 ? 'фото' : 'фото'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-booking-card text-booking-textMuted transition-colors hover:bg-booking-border hover:text-booking-textMain"
                                aria-label="Закрыть"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {lightboxIndex !== null && currentPhoto ? (
                                /* ── Lightbox view ──────────────────────────────── */
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-2xl bg-booking-card shadow-soft-out">
                                        <Image
                                            src={currentPhoto.url}
                                            alt=""
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 1024px) 90vw, 768px"
                                            priority
                                        />

                                        {/* Specialist badge */}
                                        {showSpecialistBadge && currentPhoto.specialistBadge && (
                                            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-booking-textMain shadow-sm backdrop-blur-sm">
                                                {currentPhoto.specialistBadge.avatarUrl && (
                                                    <Image
                                                        src={currentPhoto.specialistBadge.avatarUrl}
                                                        alt=""
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full object-cover"
                                                    />
                                                )}
                                                {currentPhoto.specialistBadge.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    {photos.length > 1 && (
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={goToPrev}
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-booking-card text-booking-textMuted shadow-soft-out transition hover:bg-booking-border"
                                                aria-label="Предыдущее фото"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="text-sm tabular-nums text-booking-textMuted">
                                                {lightboxIndex + 1} / {photos.length}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={goToNext}
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-booking-card text-booking-textMuted shadow-soft-out transition hover:bg-booking-border"
                                                aria-label="Следующее фото"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* CTA */}
                                    {onCtaClick && (
                                        <button
                                            type="button"
                                            onClick={() => onCtaClick(currentPhoto)}
                                            className="mt-2 h-11 rounded-full bg-booking-primary px-8 text-sm font-medium text-white shadow-soft-out transition-all hover:bg-booking-primaryHover active:scale-95"
                                        >
                                            {ctaLabel}
                                        </button>
                                    )}

                                    {/* Back to grid link */}
                                    <button
                                        type="button"
                                        onClick={() => setLightboxIndex(null)}
                                        className="text-xs text-booking-textMuted underline underline-offset-2 transition hover:text-booking-textMain"
                                    >
                                        Назад к галерее
                                    </button>
                                </div>
                            ) : (
                                /* ── Grid view ─────────────────────────────────── */
                                <CraftWallGrid
                                    photos={photos}
                                    onPhotoTap={handlePhotoTap}
                                    columns={3}
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
