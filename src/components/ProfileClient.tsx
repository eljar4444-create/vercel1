'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { BookingModal } from '@/components/BookingModal';
import { startConversationWithProvider } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { ProfileLocationMap } from '@/components/ProfileLocationMap';
import ScrollReveal from '@/components/ScrollReveal';
import { LANGUAGES, normalizeProviderLanguage } from '@/lib/provider-languages';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
    id: number;
    name: string;
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_BREAKDOWN = [
    { label: 'Качество', score: 5.0 },
    { label: 'Чистота', score: 4.9 },
    { label: 'Сервис', score: 5.0 },
    { label: 'Атмосфера', score: 4.9 },
];

const FALLBACK_COVER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23F5F2ED'/%3E%3Cstop offset='100%25' stop-color='%23E6DFD3'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23806E5A' font-family='Arial, sans-serif' font-size='56'%3ESvoi.de%3C/text%3E%3C/svg%3E";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pluralReviews(n: number) {
    if (n === 1) return 'отзыв';
    if (n >= 2 && n <= 4) return 'отзыва';
    return 'отзывов';
}

function formatPrice(price: string | number) {
    const n = Number(price);
    return n === 0 ? 'по договорённости' : `€${n.toFixed(0)}`;
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
    fallbackThumb,
}: {
    service: ProfileData['services'][number];
    onBook: () => void;
    fallbackThumb?: string | null;
}) {
    const primaryThumb = service.images?.find((image) => typeof image === 'string' && image.trim().length > 0) || null;
    const resolvedFallbackThumb = fallbackThumb || FALLBACK_COVER;
    const [thumb, setThumb] = useState<string | null>(primaryThumb || resolvedFallbackThumb);

    useEffect(() => {
        setThumb(primaryThumb || resolvedFallbackThumb);
    }, [primaryThumb, resolvedFallbackThumb, service.id]);

    const handleThumbError = () => {
        if (resolvedFallbackThumb && thumb !== resolvedFallbackThumb) {
            setThumb(resolvedFallbackThumb);
            return;
        }
        if (thumb !== FALLBACK_COVER) {
            setThumb(FALLBACK_COVER);
            return;
        }
        setThumb(null);
    };

    return (
        <div className="flex items-center gap-4 py-4">
            {/* Thumbnail */}
            {thumb ? (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#F0EBE3]">
                    <img
                        src={thumb}
                        alt={service.title}
                        className="h-full w-full object-cover"
                        onError={handleThumbError}
                    />
                </div>
            ) : (
                <div className="h-12 w-12 shrink-0 rounded-xl bg-[#F5F2ED]" />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">{service.title}</p>
                {service.description ? (
                    <p className="mt-0.5 text-xs text-stone-400 truncate">{service.description}</p>
                ) : null}
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-stone-400">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration_min === 0 ? 'по договорённости' : `${service.duration_min} мин`}
                </p>
            </div>

            {/* Price + CTA */}
            <div className="flex shrink-0 items-center gap-3">
                <span className="text-base font-semibold text-stone-800 tabular-nums">
                    {formatPrice(service.price)}
                </span>
                <button
                    onClick={onBook}
                    className="h-9 rounded-full bg-[#F5F2ED] px-4 text-xs font-medium text-stone-600 transition-all hover:bg-[#E5D5C5] active:scale-95"
                >
                    Выбрать
                </button>
            </div>
        </div>
    );
}

function ReviewCard({
    review,
}: {
    review: ProfileData['reviews'][number];
}) {
    const initials = getInitials(review.clientName);
    const date = new Date(review.createdAt).toLocaleDateString('ru-RU', {
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
                    <div className="mt-1 flex gap-0.5" aria-label={`Рейтинг: ${review.rating} из 5`}>
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [selectedService, setSelectedService] = useState<{
        id?: number;
        title: string;
        price: string;
        duration_min?: number;
    } | null>(null);

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
        services.forEach((s) => {
            const parts = s.title.split(' - ');
            const cat = parts.length > 1 ? parts[0] : 'Популярные услуги';
            const group = groups.get(cat) || [];
            group.push(s);
            groups.set(cat, group);
        });
        return Array.from(groups.entries());
    }, [services]);

    const trimmedBio = (profile.bio || '').trim();

    const coverImages = [
        ...(profile.image_url ? [profile.image_url] : []),
        ...(profile.gallery || []),
        ...(profile.studioImages || []),
    ].filter(Boolean);
    const coverSrc = coverImages[0] || FALLBACK_COVER;
    const [headerAvatarSrc, setHeaderAvatarSrc] = useState<string | null>(coverSrc);

    useEffect(() => {
        setHeaderAvatarSrc(coverSrc);
    }, [coverSrc, profile.id]);

    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=15/${profile.latitude}/${profile.longitude}`;

    const initialDate = searchParams.get('date') || undefined;
    const initialTime = searchParams.get('time') || undefined;

    // ── Booking helpers ─────────────────────────────────────────────────────
    const openBooking = (service?: { id?: number; title: string; price: string; duration_min?: number }) => {
        if (service) {
            setSelectedService(service);
            setIsModalOpen(true);
            return;
        }
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else { setSelectedService(null); setIsModalOpen(true); }
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
            toast.error(result.error || 'Не удалось открыть чат');
            return;
        }
        router.push(`/chat/${result.conversationId}`);
    }, [isStartingChat, status, session?.user, profile.id, router]);

    // ── URL-driven effects ──────────────────────────────────────────────────
    useEffect(() => {
        if (searchParams.get('book') !== '1') return;
        const serviceIdParam = Number(searchParams.get('service'));
        if (Number.isInteger(serviceIdParam)) {
            const svc = services.find((s) => s.id === serviceIdParam);
            if (svc) setSelectedService({ id: svc.id, title: svc.title, price: formatPrice(svc.price), duration_min: svc.duration_min });
        }
        setIsModalOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('book'); next.delete('service'); next.delete('date'); next.delete('time');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [pathname, router, searchParams, services]);

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
                    aria-label="Назад к поиску"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Назад к поиску
                </Link>
            </div>

            <div className="container mx-auto max-w-5xl space-y-5 px-4 py-6">

                {/* ── Hero card ─────────────────────────────────────────── */}
                {profile.provider_type === 'SALON' ? (
                    <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
                        {/* Header row */}
                        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-stone-900">
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
                                {visibleLanguages.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {visibleLanguages.map((language) => (
                                            <span
                                                key={language.value}
                                                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-700"
                                            >
                                                <span>{language.flag}</span>
                                                <span>{language.label}</span>
                                            </span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <button
                                onClick={() => openBooking()}
                                className="h-10 shrink-0 rounded-full border border-stone-600 bg-transparent px-6 text-sm font-medium tracking-wide text-stone-700 transition-all hover:bg-[#F5F2ED] active:scale-95"
                            >
                                Забронировать
                            </button>
                        </div>

                        {/* Mobile Swipe Gallery */}
                        <div className="flex md:hidden gap-2 mb-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                            {(coverImages.length > 0 ? coverImages : [FALLBACK_COVER]).map((src, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative shrink-0 snap-center overflow-hidden rounded-xl bg-stone-100 aspect-[4/3] sm:aspect-[16/7] cursor-pointer ${coverImages.length > 1 ? 'w-[92%] sm:w-[85%]' : 'w-full'}`}
                                >
                                    <img
                                        src={src}
                                        alt={`${profile.name} — фото ${idx + 1}`}
                                        fetchPriority={idx === 0 ? 'high' : 'auto'}
                                        loading={idx === 0 ? 'eager' : 'lazy'}
                                        className="absolute inset-0 h-full w-full object-cover object-top"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Desktop Grid Gallery (Planity Style) */}
                        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 mb-4 px-4 h-[320px] lg:h-[400px]">
                            {(() => {
                                const imgs = coverImages.length > 0 ? coverImages : [FALLBACK_COVER];

                                if (imgs.length >= 5) {
                                    return (
                                        <>
                                            <div onClick={() => setSelectedImageIndex(0)} className="col-span-2 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[0]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(1)} className="col-span-1 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[1]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(2)} className="col-span-1 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[2]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(3)} className="col-span-1 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[3]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(4)} className="col-span-1 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[4]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                                {imgs.length > 5 && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-semibold backdrop-blur-[2px] transition group-hover:bg-black/50">
                                                        Показать все {imgs.length} фото
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                }

                                if (imgs.length === 4) {
                                    return (
                                        <>
                                            <div onClick={() => setSelectedImageIndex(0)} className="col-span-2 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[0]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(1)} className="col-span-1 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[1]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(2)} className="col-span-1 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[2]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(3)} className="col-span-1 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[3]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                        </>
                                    );
                                }

                                if (imgs.length === 3) {
                                    return (
                                        <>
                                            <div onClick={() => setSelectedImageIndex(0)} className="col-span-2 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[0]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(1)} className="col-span-2 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[1]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(2)} className="col-span-2 row-span-1 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[2]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                        </>
                                    );
                                }

                                if (imgs.length === 2) {
                                    return (
                                        <>
                                            <div onClick={() => setSelectedImageIndex(0)} className="col-span-2 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[0]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                            <div onClick={() => setSelectedImageIndex(1)} className="col-span-2 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group">
                                                <img src={imgs[1]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                            </div>
                                        </>
                                    );
                                }

                                return (
                                    <div onClick={() => setSelectedImageIndex(0)} className="col-span-4 row-span-2 relative overflow-hidden rounded-xl bg-stone-100 cursor-pointer group aspect-[21/9] md:aspect-auto md:h-full">
                                        <img src={imgs[0]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" />
                                    </div>
                                );
                            })()}
                        </div>
                    </section>
                ) : (
                    <section className="bg-transparent mb-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-10">
                            {headerAvatarSrc ? (
                                <img
                                    src={headerAvatarSrc}
                                    alt={profile.name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-sm shrink-0 object-top"
                                    onError={() => {
                                        if (headerAvatarSrc !== FALLBACK_COVER) {
                                            setHeaderAvatarSrc(FALLBACK_COVER);
                                            return;
                                        }
                                        setHeaderAvatarSrc(null);
                                    }}
                                />
                            ) : (
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-stone-200 text-stone-600 shadow-sm shrink-0 flex items-center justify-center">
                                    <span className="text-2xl md:text-3xl font-semibold">{getInitials(profile.name)}</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
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
                            <button
                                onClick={() => openBooking()}
                                className="h-11 md:h-12 shrink-0 rounded-full border border-stone-600 bg-transparent px-6 sm:px-8 text-sm font-medium tracking-wide text-stone-700 transition-all hover:bg-[#F5F2ED] active:scale-95"
                            >
                                Забронировать
                            </button>
                        </div>
                    </section>
                )}

                {/* ── Bio ───────────────────────────────────────────────── */}
                {trimmedBio ? (
                    <ScrollReveal>
                        <section className="rounded-3xl bg-white p-6 shadow-lg">
                            <h2 className="text-xl font-semibold text-stone-800">
                                {profile.provider_type === 'SALON' ? 'О нас' : 'О мастере'}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-stone-500 whitespace-pre-wrap">
                                {trimmedBio}
                            </p>
                        </section>
                    </ScrollReveal>
                ) : null}

                {/* ── Services + Sidebar ────────────────────────────────── */}
                <ScrollReveal>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        {/* Services */}
                        <article
                            id="services"
                            className="rounded-3xl bg-white p-6 shadow-lg scroll-mt-6 md:col-span-2 h-fit self-start"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-stone-800">Услуги</h2>
                                <span className="text-xs text-stone-400">
                                    {services.length} {services.length === 1 ? 'услуга' : 'услуг'}
                                </span>
                            </div>

                            {services.length === 0 ? (
                                <p className="mt-6 text-sm text-stone-400">Список услуг пока пуст.</p>
                            ) : (
                                <div className="mt-4 space-y-6">
                                    {groupedServices.map(([groupTitle, groupItems]) => (
                                        <div key={groupTitle}>
                                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                                                {groupTitle}
                                            </p>
                                            <div className="divide-y divide-[#E5E0D8]/50">
                                                {groupItems.map((service) => (
                                                    <ServiceRow
                                                        key={service.id}
                                                        service={service}
                                                        fallbackThumb={coverSrc}
                                                        onBook={() =>
                                                            openBooking({
                                                                id: service.id,
                                                                title: service.title,
                                                                price: formatPrice(service.price),
                                                                duration_min: service.duration_min,
                                                            })
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>

                        {/* Sidebar */}
                        <aside className="md:col-span-1 md:sticky md:top-6 md:self-start">
                            <div className="rounded-3xl bg-white p-6 shadow-lg">

                                {/* Rating headline */}
                                <h2 className="text-xl font-semibold text-stone-800">Рейтинг и отзывы</h2>
                                <div className="mt-4 flex items-end gap-2">
                                    <span className="text-5xl font-bold leading-none tracking-tight text-stone-800">
                                        {profile.averageRating.toFixed(1)}
                                    </span>
                                    <span className="mb-1 text-xs text-stone-400">
                                        {profile.reviewCount} {pluralReviews(profile.reviewCount)}
                                    </span>
                                </div>

                                {/* Breakdown bars */}
                                <div className="mt-5 space-y-3">
                                    {RATING_BREAKDOWN.map((item) => (
                                        <RatingBar key={item.label} label={item.label} score={item.score} />
                                    ))}
                                </div>

                                {/* Price from */}
                                {cheapestService ? (
                                    <div className="mt-6 border-t border-[#E5E0D8]/50 pt-5">
                                        <p className="text-xs uppercase tracking-widest text-stone-400">Цена от</p>
                                        <p className="mt-1 text-3xl font-bold text-stone-800 tabular-nums">
                                            {formatPrice(cheapestService.price)}
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
                                    {isStartingChat ? 'Открываем…' : 'Написать мастеру'}
                                </button>
                            </div>
                        </aside>
                    </div>
                </ScrollReveal>

                {/* ── Map ───────────────────────────────────────────────── */}
                <ScrollReveal>
                    <section className="rounded-3xl bg-white p-6 shadow-lg">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-stone-800">Как нас найти</h2>
                                <p className="mt-0.5 text-sm text-stone-400">{visibleAddress}</p>
                            </div>
                            <a
                                href={openStreetMapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E5D5C5] px-3 py-2 text-xs font-medium text-stone-600 transition-all hover:bg-[#F5F2ED]"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Открыть в OpenStreetMap
                            </a>
                        </div>
                        <div className="overflow-hidden rounded-2xl">
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
                    <section className="rounded-3xl bg-white p-6 shadow-lg">
                        <h2 className="text-xl font-semibold text-stone-800">Отзывы клиентов</h2>

                        {profile.reviews && profile.reviews.length > 0 ? (
                            <div className="mt-5 divide-y divide-[#E5E0D8]/50">
                                {profile.reviews.slice(0, 5).map((review) => (
                                    <ReviewCard key={review.id} review={review} />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-stone-50 py-12 text-center">
                                <Star className="h-8 w-8 text-stone-200" />
                                <p className="text-sm text-stone-400">
                                    Пока нет отзывов. Станьте первым, кто оценит работу мастера!
                                </p>
                            </div>
                        )}
                    </section>
                </ScrollReveal>

            </div>

            {/* ── Booking modal ────────────────────────────────────────── */}
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                masterName={profile.name}
                masterAddress={visibleAddress}
                rating={5}
                profileId={profile.id}
                selectedService={selectedService}
                initialDate={initialDate}
                initialTime={initialTime}
                accentColor="rose"
            />
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
                            aria-label="Закрыть галерею"
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
                                aria-label="Предыдущее фото"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 z-50 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-30"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex((prev) => (prev! < coverImages.length - 1 ? prev! + 1 : 0));
                                }}
                                aria-label="Следующее фото"
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
