'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { X, User, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Staff } from './StaffSection';

export interface StaffModalService {
    id: number;
    title: string;
    price: string;
    duration_min: number;
}

interface StaffPortfolioModalProps {
    staff: Staff;
    salonSlug: string;
    isOpen: boolean;
    onClose: () => void;
    services?: StaffModalService[];
}

type TabId = 'about' | 'services' | 'portfolio' | 'reviews';

const MOCK_REVIEWS = [
    {
        id: 'r1',
        nameKey: 'modals.staffPortfolio.mockReviews.r1.name',
        dateKey: 'modals.staffPortfolio.mockReviews.r1.date',
        textKey: 'modals.staffPortfolio.mockReviews.r1.text',
        rating: 5,
    },
    {
        id: 'r2',
        nameKey: 'modals.staffPortfolio.mockReviews.r2.name',
        dateKey: 'modals.staffPortfolio.mockReviews.r2.date',
        textKey: 'modals.staffPortfolio.mockReviews.r2.text',
        rating: 5,
    },
    {
        id: 'r3',
        nameKey: 'modals.staffPortfolio.mockReviews.r3.name',
        dateKey: 'modals.staffPortfolio.mockReviews.r3.date',
        textKey: 'modals.staffPortfolio.mockReviews.r3.text',
        rating: 5,
    },
] as const;

export function StaffPortfolioModal({ staff, salonSlug, isOpen, onClose, services = [] }: StaffPortfolioModalProps) {
    const router = useRouter();
    const t = useTranslations('salon');
    const [activeTab, setActiveTab] = useState<TabId>('about');

    if (!isOpen) return null;

    const tabs: { id: TabId; label: string }[] = [
        { id: 'about', label: t('modals.staffPortfolio.tabs.about') },
        { id: 'services', label: t('modals.staffPortfolio.tabs.services') },
        { id: 'portfolio', label: t('modals.staffPortfolio.tabs.portfolio') },
        { id: 'reviews', label: t('modals.staffPortfolio.tabs.reviews') },
    ];

    const rating = typeof staff.rating === 'number' ? staff.rating : 5.0;
    const reviewCount = 8;

    const handleBookStaff = () => {
        router.push(`/book/${salonSlug}?staffId=${staff.id}`);
    };

    const handleSelectService = (serviceId: number) => {
        router.push(`/book/${salonSlug}?staffId=${staff.id}&serviceId=${serviceId}`);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="relative flex h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label={t('modals.close')}
                    className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Centered Header */}
                <div className="flex flex-col items-center px-6 pt-10 pb-2 text-center shrink-0">
                    <div className="relative h-24 w-24 mx-auto overflow-hidden rounded-full border border-gray-200 cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-md">
                        {staff.avatarUrl ? (
                            <Image src={staff.avatarUrl} alt={staff.name} fill className="object-cover" sizes="96px" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                <User className="h-10 w-10" aria-hidden="true" />
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold mt-4 text-gray-900">{staff.name}</h2>
                    <p className="mt-1 inline-flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
                        <span>({t('service.reviewsPlural', { count: reviewCount })})</span>
                    </p>
                </div>

                {/* Scrollable body — tabs are sticky within this container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-center gap-2 mt-6 border-b border-gray-100 pb-4 sticky top-0 bg-white z-10 px-4">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={
                                        isActive
                                            ? 'bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-4 py-1.5 rounded-full text-sm font-medium transition-colors'
                                    }
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 px-6 pb-32">
                        {activeTab === 'about' && <AboutTab staff={staff} />}
                        {activeTab === 'services' && (
                            <ServicesTab services={services} onSelect={handleSelectService} />
                        )}
                        {activeTab === 'portfolio' && (
                            <PortfolioTab photos={staff.photos ?? []} staffName={staff.name} />
                        )}
                        {activeTab === 'reviews' && (
                            <ReviewsTab rating={rating} reviewCount={reviewCount} />
                        )}
                    </div>
                </div>

                {/* Sticky bottom CTA */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-5 px-6">
                    <button
                        onClick={handleBookStaff}
                        className="pointer-events-auto w-full rounded-full bg-emerald-800 py-4 text-center text-sm font-semibold tracking-wide text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-700 active:scale-95"
                    >
                        {t('modals.staffPortfolio.ctaBookStaff')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AboutTab({ staff }: { staff: Staff }) {
    const t = useTranslations('salon');
    const tags = staff.tags ?? [];
    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">430</p>
                    <p className="mt-1 text-xs text-gray-500">{t('modals.staffPortfolio.stats.completedOrders')}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">124</p>
                    <p className="mt-1 text-xs text-gray-500">{t('modals.staffPortfolio.stats.clients')}</p>
                </div>
            </div>

            {staff.specialty && (
                <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('modals.staffPortfolio.specialty')}</h3>
                    <p className="text-sm text-gray-500">{staff.specialty}</p>
                </div>
            )}

            {tags.length > 0 && (
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('modals.staffPortfolio.interests')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ServicesTab({
    services,
    onSelect,
}: {
    services: StaffModalService[];
    onSelect: (id: number) => void;
}) {
    const t = useTranslations('salon');
    const formatPrice = (price: string) => {
        const n = Number(price);
        return n === 0 ? t('price.onRequest') : `€${n.toFixed(0)}`;
    };
    const formatDuration = (min: number) => {
        return min === 0 ? t('service.durationOnRequest') : t('service.durationMin', { count: min });
    };

    if (services.length === 0) {
        return <p className="py-10 text-center text-sm text-gray-400">{t('modals.staffPortfolio.servicesEmpty')}</p>;
    }
    return (
        <ul className="flex flex-col divide-y divide-gray-100">
            {services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{service.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDuration(service.duration_min)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(service.price)}</span>
                        <button
                            type="button"
                            onClick={() => onSelect(service.id)}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                            {t('service.select')}
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function PortfolioTab({ photos, staffName }: { photos: string[]; staffName: string }) {
    const t = useTranslations('salon');
    if (photos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                    <User className="h-7 w-7" />
                </div>
                <p className="text-sm">{t('modals.staffPortfolio.portfolioEmpty')}</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                    <Image
                        src={photo}
                        alt={t('modals.staffPortfolio.portfolioAlt', { name: staffName })}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                    />
                </div>
            ))}
        </div>
    );
}

function ReviewsTab({ rating, reviewCount }: { rating: number; reviewCount: number }) {
    const t = useTranslations('salon');
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{rating.toFixed(1)}</p>
                    <div className="mt-1 flex items-center justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                </div>
                <div className="text-sm">
                    <p className="font-medium text-gray-700">{t('modals.staffPortfolio.reviewsSummary', { count: reviewCount })}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{t('modals.staffPortfolio.verifiedClients')}</p>
                </div>
            </div>
            <ul className="flex flex-col gap-4">
                {MOCK_REVIEWS.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">{t(review.nameKey)}</p>
                                <p className="text-xs text-gray-400">{t(review.dateKey)}</p>
                            </div>
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">{t(review.textKey)}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
