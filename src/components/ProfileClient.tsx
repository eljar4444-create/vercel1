'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Clock,
    ChevronLeft,
    MessageCircle,
    Star,
    MapPin,
    ExternalLink,
    ChevronRight,
    X,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useTranslations, useLocale } from 'next-intl';

import { startConversationWithProvider } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { ProfileLocationMap } from '@/components/ProfileLocationMap';
import ScrollReveal from '@/components/ScrollReveal';
import { StaffSection } from '@/components/profile/StaffSection';
import { LANGUAGES, normalizeProviderLanguage } from '@/lib/provider-languages';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
    id: number;
    name: string;
    slug: string;
    provider_type: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    city: string;
    address?: string | null;
    image_url?: string | null;
    gallery: string[];
    studioImages: string[];
    bio?: string | null;
    phone?: string | null;
    languages: string[];
    is_verified: boolean;
    created_at: string;
    latitude: number;
    longitude: number;
    attributes: any;
    category: { id: number; name: string; slug: string } | null;
    services: {
        id: number;
        title: string;
        description?: string | null;
        images?: string[];
        portfolioPhotos?: string[];
        price: string;
        duration_min: number;
    }[];
    reviews: {
        id: string;
        comment: string | null;
        rating: number;
        createdAt: string;
        clientName: string;
    }[];
    averageRating: number;
    reviewCount: number;
    staff?: { id: string; name: string; avatarUrl: string | null; specialty?: string | null; photos?: string[] }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_BREAKDOWN_KEYS = ['quality', 'cleanliness', 'service', 'atmosphere'] as const;
const RATING_BREAKDOWN_SCORES: Record<typeof RATING_BREAKDOWN_KEYS[number], number> = {
    quality: 5.0,
    cleanliness: 4.9,
    service: 5.0,
    atmosphere: 4.9,
};

const FALLBACK_COVER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23F5F2ED'/%3E%3Cstop offset='100%25' stop-color='%23E6DFD3'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23806E5A' font-family='Arial, sans-serif' font-size='56'%3ESvoi.de%3C/text%3E%3C/svg%3E";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPriceValue(price: string | number, onRequestLabel: string) {
    const n = Number(price);
    return n === 0 ? onRequestLabel : `€${n.toFixed(0)}`;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function formatProviderLanguages(languages: string[]) {
    return languages
        .map((language) => normalizeProviderLanguage(language))
        .filter((language): language is keyof typeof LANGUAGES => Boolean(language))
        .map((language) => ({
            value: language,
            ...LANGUAGES[language],
        }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingBar({ label, score }: { label: string; score: number }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-stone-500">{label}</span>
            <div className="flex-1 h-1 rounded-full bg-stone-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-stone-700 transition-all duration-500"
                    style={{ width: `${(score / 5) * 100}%` }}
                />
            </div>
            <span className="w-6 shrink-0 text-right text-stone-700 font-medium tabular-nums">
                {score.toFixed(1)}
            </span>
        </div>
    );
}

function ServiceRow({
    service,
    onBook,
}: {
    service: ProfileData['services'][number];
    onBook: () => void;
    fallbackThumb?: string | null;
}) {
    const t = useTranslations('salon');
    const portfolioPhotoList = (service.portfolioPhotos ?? []).filter(
        (url): url is string => typeof url === 'string' && url.trim().length > 0
    );
    const legacyImageList = (service.images ?? []).filter(
        (img): img is string => typeof img === 'string' && img.trim().length > 0
    );
    const allPhotos = [...portfolioPhotoList, ...legacyImageList];
    const visiblePhotos = allPhotos.slice(0, 4);
    const remainingCount = allPhotos.length - 4;

    const hasDescription =
        typeof service.description === 'string' &&
        service.description.trim().length > 0 &&
        service.description.trim() !== '-';

    return (
        <div className="flex flex-col py-6 border-b border-gray-200/60 last:border-0">
            <div className="flex justify-between items-start w-full gap-4">
                <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-base font-medium text-gray-900 truncate">{service.title}</p>
                    {hasDescription && (
                        <p className="mt-0.5 text-sm text-gray-500 truncate">{service.description}</p>
                    )}
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration_min === 0
                            ? t('service.durationOnRequest')
                            : t('service.durationMin', { count: service.duration_min })}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                    <span className="text-lg font-semibold text-gray-900 tabular-nums">
                        {formatPriceValue(service.price, t('price.onRequest'))}
                    </span>
                    <button
                        onClick={onBook}
                        className="rounded-full border border-gray-300 bg-transparent px-5 py-2 text-sm font-medium text-gray-900 transition-all hover:border-gray-900 hover:bg-gray-50 active:scale-95"
                    >
                        {t('service.select')}
                    </button>
                </div>
            </div>

            {visiblePhotos.length > 0 && (
                <div className="flex gap-2 mt-4">
                    {visiblePhotos.map((url, index) => (
                        <div
                            key={`${url}-${index}`}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 cursor-pointer"
                        >
                            <Image
                                src={url}
                                alt={`${service.title} ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                            {index === 3 && remainingCount > 0 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        +{remainingCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ReviewCard({
    review,
}: {
    review: ProfileData['reviews'][number];
}) {
    const t = useTranslations('salon');
    const locale = useLocale();
    const initials = getInitials(review.clientName);
    const date = new Date(review.createdAt).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="py-5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F2ED] text-xs font-semibold text-stone-600">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-stone-800">{review.clientName}</span>
                        <span className="text-xs text-stone-400 shrink-0">{date}</span>
                    </div>
                    <div className="mt-1 flex gap-0.5" aria-label={t('rating.aria', { rating: review.rating })}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
                            />
                        ))}
                    </div>
                    {review.comment ? (
                        <p className="mt-2 text-sm leading-relaxed text-stone-500">{review.comment}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileClient({ profile }: { profile: ProfileData }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const t = useTranslations('salon');

    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isStartingChat, setIsStartingChat] = useState(false);

    // ── Derived values ──────────────────────────────────────────────────────
    const services = useMemo(() => profile.services || [], [profile.services]);

    const cheapestService = useMemo(
        () =>
            services.length > 0
                ? services.reduce((min, cur) => (Number(cur.price) < Number(min.price) ? cur : min), services[0])
                : null,
        [services]
    );

    const fullAddress = [profile.address, profile.city].filter(Boolean).join(', ');
    const visibleAddress =
        profile.provider_type === 'SALON' ? fullAddress || profile.city : profile.city;
    const visibleLanguages = useMemo(() => formatProviderLanguages(profile.languages || []), [profile.languages]);

    const priceLevel = useMemo(() => {
        if (services.length === 0) return '€€€';
        const avg = services.reduce((sum, s) => sum + Number(s.price), 0) / services.length;
        if (avg < 50) return '€';
        if (avg < 90) return '€€';
        return '€€€';
    }, [services]);

    const groupedServices = useMemo(() => {
        const groups = new Map<string, ProfileData['services']>();
        const defaultGroup = t('section.servicesDefaultGroup');
        services.forEach((s) => {
            const parts = s.title.split(' - ');
            const cat = parts.length > 1 ? parts[0] : defaultGroup;
            const group = groups.get(cat) || [];
            group.push(s);
            groups.set(cat, group);
        });
        return Array.from(groups.entries());
    }, [services, t]);

    const trimmedBio = (profile.bio || '').trim();

    const bannerImages = [
        ...(profile.gallery || []),
        ...(profile.studioImages || []),
    ].filter(Boolean);
    const coverImages = bannerImages;
    const coverSrc = coverImages[0] || FALLBACK_COVER;
    const [headerAvatarSrc, setHeaderAvatarSrc] = useState<string | null>(coverSrc);

    useEffect(() => {
        setHeaderAvatarSrc(coverSrc);
    }, [coverSrc, profile.id]);

    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=15/${profile.latitude}/${profile.longitude}`;

    // ── Booking helpers ─────────────────────────────────────────────────────
    const openBooking = (service?: { id?: number; title: string; price: string; duration_min?: number }) => {
        if (service && service.id) {
            router.push(`/book/${profile.slug}?serviceId=${service.id}`);
            return;
        }
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else { router.push(`/book/${profile.slug}`); }
    };

    const startChat = useCallback(async () => {
        if (isStartingChat) return;
        if (status !== 'authenticated' || !session?.user) {
            if (typeof window === 'undefined') return;
            const url = new URL(window.location.href);
            url.searchParams.set('startChat', '1');
            await signIn(undefined, { callbackUrl: url.toString() });
            return;
        }
        setIsStartingChat(true);
        const result = await startConversationWithProvider(profile.id);
        setIsStartingChat(false);
        if (!result.success || !result.conversationId) {
            toast.error(result.error || t('chat.failed'));
            return;
        }
        router.push(`/chat/${result.conversationId}`);
    }, [isStartingChat, status, session?.user, profile.id, router]);

    // ── URL-driven effects ──────────────────────────────────────────────────
    useEffect(() => {
        if (searchParams.get('book') !== '1') return;
        const serviceIdParam = Number(searchParams.get('service'));
        const next = new URLSearchParams(searchParams.toString());
        next.delete('book'); next.delete('service'); next.delete('date'); next.delete('time');
        const q = next.toString();

        let targetServiceId = '';
        if (Number.isInteger(serviceIdParam)) {
            const svc = services.find((s) => s.id === serviceIdParam);
            if (svc) targetServiceId = `?serviceId=${svc.id}`;
        }

        // Redirect completely out of profile to the new book wizard route
        router.replace(`/book/${profile.slug}${targetServiceId}`);
    }, [router, searchParams, services, profile.slug]);

    useEffect(() => {
        if (searchParams.get('startChat') !== '1') return;
        if (status !== 'authenticated' || !session?.user) return;
        startChat();
        const next = new URLSearchParams(searchParams.toString());
        next.delete('startChat');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [status, session?.user, pathname, router, searchParams, startChat]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen">

            {/* ── Back nav ──────────────────────────────────────────────── */}
            <div className="container mx-auto max-w-5xl px-4 pt-6 pb-0">
                <Link
                    href={`/search${profile.category?.slug ? `?category=${profile.category.slug}` : ''}`}
                    className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-800"
                    aria-label={t('backToSearch')}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t('backToSearch')}
                </Link>
            </div>

            <div className="container mx-auto max-w-5xl space-y-5 px-4 py-6">

                {/* ── Hero card ─────────────────────────────────────────── */}
                {profile.provider_type === 'SALON' ? (
                    <section className="bg-transparent border-b border-gray-300 pb-8 mb-8">
                        <div
                            className="w-full h-48 md:h-64 relative overflow-hidden rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-1 bg-stone-100 group cursor-pointer"
                            onClick={() => setSelectedImageIndex(0)}
                        >
                            {coverImages.length > 0 ? (
                                <>
                                    {/* Image 1 (Left) */}
                                    <div className={`relative w-full h-full overflow-hidden ${coverImages.length === 1 ? 'md:col-span-2' : ''}`}>
                                        <Image
                                            src={coverImages[0]}
                                            alt={t('gallery.coverAlt', { name: profile.name })}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority
                                            fetchPriority="high"
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Image 2 (Right) */}
                                    {coverImages.length > 1 && (
                                        <div className="relative w-full h-full hidden md:block overflow-hidden">
                                            <Image
                                                src={coverImages[1]}
                                                alt={t('gallery.coverAltN', { name: profile.name, n: 2 })}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full md:col-span-2 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50" />
                            )}

                            {/* Subtle Gradient Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 md:col-span-2 h-32 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

                            {/* Photo Count Badge */}
                            {coverImages.length > 2 && (
                                <div
                                    className="absolute bottom-4 right-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-white flex items-center gap-1.5 shadow-sm border border-white/20 transition-all hover:bg-black/50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(0);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                    {t('gallery.viewAllPhotos', { count: coverImages.length })}
                                </div>
                            )}
                        </div>

                        <div className="px-0 pt-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                                        {profile.name}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-stone-400" />
                                            {visibleAddress}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-start">
                                    {visibleLanguages.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            {visibleLanguages.map((language) => (
                                                <span
                                                    key={language.value}
                                                    title={language.label}
                                                    aria-label={language.label}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-lg leading-none shadow-sm"
                                                >
                                                    {language.flag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => openBooking()}
                                        className="h-10 sm:h-11 shrink-0 rounded-full border border-stone-600 bg-transparent px-6 sm:px-8 text-sm font-medium tracking-wide text-stone-700 transition-all hover:bg-[#F5F2ED] active:scale-95"
                                    >
                                        {t('ctaBook')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="bg-transparent border-b border-gray-300 pb-8 mb-8">
                        {/* Cover Banner — same grid layout as Salon */}
                        <div
                            className="w-full h-48 md:h-64 relative overflow-hidden rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-1 bg-stone-100 group cursor-pointer"
                            onClick={() => setSelectedImageIndex(0)}
                        >
                            {coverImages.length > 0 ? (
                                <>
                                    {/* Image 1 (Left) */}
                                    <div className={`relative w-full h-full overflow-hidden ${coverImages.length === 1 ? 'md:col-span-2' : ''}`}>
                                        <Image
                                            src={coverImages[0]}
                                            alt={t('gallery.coverAlt', { name: profile.name })}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority
                                            fetchPriority="high"
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Image 2 (Right) */}
                                    {coverImages.length > 1 && (
                                        <div className="relative w-full h-full hidden md:block overflow-hidden">
                                            <Image
                                                src={coverImages[1]}
                                                alt={t('gallery.coverAltN', { name: profile.name, n: 2 })}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full md:col-span-2 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50" />
                            )}

                            {/* Subtle Gradient Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 md:col-span-2 h-32 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

                            {/* Photo Count Badge */}
                            {coverImages.length > 2 && (
                                <div
                                    className="absolute bottom-4 right-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide text-white flex items-center gap-1.5 shadow-sm border border-white/20 transition-all hover:bg-black/50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(0);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                    {t('gallery.viewAllPhotos', { count: coverImages.length })}
                                </div>
                            )}
                        </div>

                        {/* Header Content with Avatar Overlap */}
                        <div className="-mt-12 sm:-mt-16 relative z-10 px-4 sm:px-8">
                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                                {/* Avatar */}
                                {profile.image_url ? (
                                    <Image src={profile.image_url} alt={profile.name} width={128} height={128} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-sm shrink-0 object-top border-4 border-[#faf8f5] bg-[#faf8f5]" />
                                ) : (
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-stone-200 text-stone-600 shadow-sm shrink-0 flex items-center justify-center border-4 border-[#faf8f5]">
                                        <span className="text-2xl md:text-3xl font-semibold">{getInitials(profile.name)}</span>
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 md:pb-2 w-full">
                                    <h1 className="text-3xl font-bold tracking-tight text-stone-900 truncate">
                                        {profile.name}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-stone-400" />
                                            {visibleAddress}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                            <span className="font-medium text-stone-700">
                                                {profile.averageRating.toFixed(1)}
                                            </span>
                                        </span>
                                        <span className="text-stone-400">{priceLevel}</span>
                                    </div>
                                </div>
                                <div className="md:pb-3 w-full md:w-auto">
                                    <button
                                        onClick={() => openBooking()}
                                        className="w-full md:w-auto h-11 md:h-12 shrink-0 rounded-full border border-stone-600 bg-transparent px-6 sm:px-8 text-sm font-medium tracking-wide text-stone-700 transition-all hover:bg-[#F5F2ED] active:scale-95"
                                    >
                                        {t('ctaBook')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Bio ───────────────────────────────────────────────── */}
                {trimmedBio ? (
                    <ScrollReveal>
                        <section className="bg-transparent">
                            <h2 className="text-xl font-semibold text-stone-800">
                                {profile.provider_type === 'SALON' ? t('section.aboutSalon') : t('section.aboutMaster')}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-stone-500 whitespace-pre-wrap">
                                {trimmedBio}
                            </p>
                        </section>
                    </ScrollReveal>
                ) : null}

                {/* ── Staff + Reviews sidebar ───────────────────────────── */}
                {profile.provider_type === 'SALON' && profile.staff && profile.staff.length > 0 ? (
                    <ScrollReveal>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch border-t border-gray-300 pt-10 mt-10">
                            <div className="col-span-1 lg:col-span-2 border-b border-gray-300 pb-10 mb-10 lg:border-b-0 lg:pb-0 lg:mb-0 lg:border-r lg:border-gray-300 lg:pr-12">
                                <StaffSection
                                    staff={profile.staff}
                                    salonSlug={profile.slug}
                                    services={profile.services.map((s) => ({
                                        id: s.id,
                                        title: s.title,
                                        price: s.price,
                                        duration_min: s.duration_min,
                                    }))}
                                />
                            </div>

                            <aside className="col-span-1 flex h-full flex-col lg:pl-12">
                                <h2 className="text-xl font-semibold text-stone-800 mb-5">{t('section.ratingAndReviews')}</h2>
                                <div className="h-full w-full bg-transparent">

                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-bold leading-none tracking-tight text-stone-800">
                                            {profile.averageRating.toFixed(1)}
                                        </span>
                                        <span className="mb-1 text-xs text-stone-400">
                                            {t('service.reviewsPlural', { count: profile.reviewCount })}
                                        </span>
                                    </div>

                                    {/* Breakdown bars */}
                                    <div className="mt-5 space-y-3">
                                        {RATING_BREAKDOWN_KEYS.map((key) => (
                                            <RatingBar key={key} label={t(`rating.${key}`)} score={RATING_BREAKDOWN_SCORES[key]} />
                                        ))}
                                    </div>

                                    {/* Price from */}
                                    {cheapestService ? (
                                        <div className="mt-6 border-t border-[#E5E0D8]/50 pt-5">
                                            <p className="text-xs uppercase tracking-widest text-stone-400">{t('price.from')}</p>
                                            <p className="mt-1 text-3xl font-bold text-stone-800 tabular-nums">
                                                {formatPriceValue(cheapestService.price, t('price.onRequest'))}
                                            </p>
                                        </div>
                                    ) : null}

                                    {/* Chat button */}
                                    <button
                                        onClick={startChat}
                                        disabled={isStartingChat}
                                        className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#E5D5C5] text-sm font-medium text-stone-600 transition-all hover:bg-[#F5F2ED] disabled:opacity-60"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        {isStartingChat ? t('chat.opening') : t('ctaMessage')}
                                    </button>
                                </div>
                            </aside>
                        </div>
                    </ScrollReveal>
                ) : null}

                {/* ── Services + Sidebar (Private) / Services full-width (Salon) ─ */}
                {(() => {
                    const hasSalonStaff = profile.provider_type === 'SALON' && profile.staff && profile.staff.length > 0;
                    return (
                        <ScrollReveal>
                            <div className={hasSalonStaff ? 'grid grid-cols-1 border-t border-gray-300 pt-10 mt-10' : 'grid grid-cols-1 gap-0 md:grid-cols-3 border-t border-gray-300 pt-10 mt-10'}>

                                {/* Services */}
                                <article
                                    id="services"
                                    className={`bg-transparent scroll-mt-6 h-fit self-start ${hasSalonStaff
                                            ? ''
                                            : 'md:col-span-2 border-b border-gray-300 pb-10 mb-10 md:border-b-0 md:pb-0 md:mb-0 md:border-r md:border-gray-300 md:pr-12'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-stone-800">{t('section.services')}</h2>
                                        <span className="text-xs text-stone-400">
                                            {t('service.countPlural', { count: services.length })}
                                        </span>
                                    </div>

                                    {services.length === 0 ? (
                                        <p className="mt-6 text-sm text-stone-400">{t('section.servicesEmpty')}</p>
                                    ) : (
                                        <div className="mt-4 space-y-6">
                                            {groupedServices.map(([groupTitle, groupItems]) => (
                                                <div key={groupTitle}>
                                                    {groupItems.map((service) => (
                                                        <ServiceRow
                                                            key={service.id}
                                                            service={service}
                                                            fallbackThumb={coverSrc}
                                                            onBook={() =>
                                                                openBooking({
                                                                    id: service.id,
                                                                    title: service.title,
                                                                    price: formatPriceValue(service.price, t('price.onRequest')),
                                                                    duration_min: service.duration_min,
                                                                })
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </article>

                                {/* Sidebar (Private / non-staff Salon only) */}
                                {!hasSalonStaff && (
                                    <aside className="md:col-span-1 md:sticky md:top-6 md:self-start md:pl-12">
                                        <div className="bg-transparent">

                                            {/* Rating headline */}
                                            <h2 className="text-xl font-semibold text-stone-800">Рейтинг и отзывы</h2>
                                            <div className="mt-4 flex items-end gap-2">
                                                <span className="text-5xl font-bold leading-none tracking-tight text-stone-800">
                                                    {profile.averageRating.toFixed(1)}
                                                </span>
                                                <span className="mb-1 text-xs text-stone-400">
                                                    {t('service.reviewsPlural', { count: profile.reviewCount })}
                                                </span>
                                            </div>

                                            {/* Breakdown bars */}
                                            <div className="mt-5 space-y-3">
                                                {RATING_BREAKDOWN_KEYS.map((key) => (
                                                    <RatingBar key={key} label={t(`rating.${key}`)} score={RATING_BREAKDOWN_SCORES[key]} />
                                                ))}
                                            </div>

                                            {/* Price from */}
                                            {cheapestService ? (
                                                <div className="mt-6 border-t border-[#E5E0D8]/50 pt-5">
                                                    <p className="text-xs uppercase tracking-widest text-stone-400">{t('price.from')}</p>
                                                    <p className="mt-1 text-3xl font-bold text-stone-800 tabular-nums">
                                                        {formatPriceValue(cheapestService.price, t('price.onRequest'))}
                                                    </p>
                                                </div>
                                            ) : null}

                                            {/* Chat button */}
                                            <button
                                                onClick={startChat}
                                                disabled={isStartingChat}
                                                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#E5D5C5] text-sm font-medium text-stone-600 transition-all hover:bg-[#F5F2ED] disabled:opacity-60"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                {isStartingChat ? t('chat.opening') : t('ctaMessage')}
                                            </button>
                                        </div>
                                    </aside>
                                )}
                            </div>
                        </ScrollReveal>
                    );
                })()}

                {/* ── Map ───────────────────────────────────────────────── */}
                <ScrollReveal>
                    <section className="bg-transparent border-t border-gray-300 pt-10 mt-10 w-full">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-stone-800">{t('section.findUs')}</h2>
                                <p className="mt-0.5 text-sm text-stone-400">{visibleAddress}</p>
                            </div>
                            <a
                                href={openStreetMapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E5D5C5] px-3 py-2 text-xs font-medium text-stone-600 transition-all hover:bg-[#F5F2ED]"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {t('map.openInOsm')}
                            </a>
                        </div>
                        <div className="overflow-hidden rounded-2xl shadow-sm">
                            <ProfileLocationMap
                                lat={profile.latitude}
                                lng={profile.longitude}
                                title={profile.name}
                                address={visibleAddress}
                            />
                        </div>
                    </section>
                </ScrollReveal>

                {/* ── Reviews ───────────────────────────────────────────── */}
                <ScrollReveal>
                    <section className="bg-transparent border-t border-gray-300 pt-10 mt-10">
                        <h2 className="text-xl font-semibold text-stone-800">{t('section.reviews')}</h2>

                        {profile.reviews && profile.reviews.length > 0 ? (
                            <div className="mt-5 divide-y divide-gray-200/50">
                                {profile.reviews.slice(0, 5).map((review) => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 flex flex-col items-center gap-3 py-12 text-center">
                                <Star className="h-8 w-8 text-stone-200" />
                                <p className="text-sm text-stone-400">
                                    {t('section.reviewsEmpty')}
                                </p>
                            </div>
                        )}
                    </section>
                </ScrollReveal>

            </div>

            {/* ── Booking route redirect handles booking context internally ── */}
            {/* ── Photo Lightbox Modal ────────────────────────────────────── */}
            {selectedImageIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={() => setSelectedImageIndex(null)}
                >
                    {/* Close Area */}
                    <div className="absolute right-4 top-4 z-50">
                        <button
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex(null);
                            }}
                            aria-label={t('gallery.closeGallery')}
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Prev / Next controls */}
                    {coverImages.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex((prev) => (prev! > 0 ? prev! - 1 : coverImages.length - 1));
                                }}
                                aria-label={t('gallery.prevPhoto')}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex((prev) => (prev! < coverImages.length - 1 ? prev! + 1 : 0));
                                }}
                                aria-label={t('gallery.nextPhoto')}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <div className="relative h-full max-h-[90vh] w-full max-w-[90vw] p-4 text-center select-none" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={coverImages.length > 0 ? coverImages[selectedImageIndex] : FALLBACK_COVER}
                            alt="Full screen photo"
                            className="h-full w-full object-contain pointer-events-none"
                        />
                        <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 text-sm text-stone-400">
                            {selectedImageIndex + 1} / {Math.max(coverImages.length, 1)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
