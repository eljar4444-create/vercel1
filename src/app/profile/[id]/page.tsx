import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    MapPin, Star, Clock, Euro, CheckCircle2, Shield,
    ExternalLink, Calendar, Globe, UserCircle, ChevronLeft,
    Sparkles, Stethoscope, Phone, MessageCircle, ThumbsUp
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ─── Category accent config ─────────────────────────────────────────
const ACCENT: Record<string, {
    primary: string;
    primaryBg: string;
    primaryHover: string;
    badge: string;
    badgeText: string;
    light: string;
    icon: React.ReactNode;
    starColor: string;
    selectBtn: string;
    selectBtnHover: string;
}> = {
    beauty: {
        primary: 'bg-rose-600',
        primaryBg: 'bg-rose-50',
        primaryHover: 'hover:bg-rose-700',
        badge: 'bg-rose-50',
        badgeText: 'text-rose-700',
        light: 'text-rose-600',
        icon: <Sparkles className="w-4 h-4" />,
        starColor: 'text-rose-400',
        selectBtn: 'bg-rose-600',
        selectBtnHover: 'hover:bg-rose-700',
    },
    health: {
        primary: 'bg-teal-600',
        primaryBg: 'bg-teal-50',
        primaryHover: 'hover:bg-teal-700',
        badge: 'bg-teal-50',
        badgeText: 'text-teal-700',
        light: 'text-teal-600',
        icon: <Stethoscope className="w-4 h-4" />,
        starColor: 'text-teal-400',
        selectBtn: 'bg-teal-600',
        selectBtnHover: 'hover:bg-teal-700',
    },
};

const DEFAULT_ACCENT = ACCENT.beauty;

// ─── Fake reviews (no reviews table yet) ────────────────────────────
const FAKE_REVIEWS = [
    {
        name: 'Ольга М.',
        initials: 'ОМ',
        date: '12 января 2026',
        rating: 5,
        text: 'Отличный специалист! Очень аккуратная работа, результат превзошёл ожидания. Обязательно приду снова. Рекомендую всем!',
        bg: 'bg-pink-100 text-pink-600',
    },
    {
        name: 'Анна К.',
        initials: 'АК',
        date: '3 февраля 2026',
        rating: 5,
        text: 'Приятная атмосфера, мастер всё объяснила, подобрала именно то, что нужно. Результатом очень довольна!',
        bg: 'bg-blue-100 text-blue-600',
    },
];

// ─── Language flags ─────────────────────────────────────────────────
const LANG_FLAGS: Record<string, { flag: string; label: string }> = {
    RU: { flag: '🇷🇺', label: 'Русский' },
    DE: { flag: '🇩🇪', label: 'Deutsch' },
    EN: { flag: '🇬🇧', label: 'English' },
    UA: { flag: '🇺🇦', label: 'Українська' },
    TR: { flag: '🇹🇷', label: 'Türkçe' },
};

// ─── Main Page Component ────────────────────────────────────────────
export default async function ProfileDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const profileId = parseInt(params.id, 10);
    if (isNaN(profileId)) notFound();

    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
            category: true,
            services: true,
        },
    });

    if (!profile) notFound();

    // ─── Derived data ───────────────────────────────────────────────
    const catSlug = profile.category?.slug || 'beauty';
    const accent = ACCENT[catSlug] || DEFAULT_ACCENT;
    const attrs = (profile.attributes as any) || {};
    const languages: string[] = attrs.languages || attrs.sprachen || [];
    const services = profile.services || [];
    const cheapest = services.length > 0
        ? services.reduce((min, s) => Number(s.price) < Number(min.price) ? s : min, services[0])
        : null;

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${profile.address || ''} ${profile.city}`
    )}`;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* TOP BAR                                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex items-center h-14 gap-4">
                        <Link
                            href={`/search${catSlug ? `?category=${catSlug}` : ''}`}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Назад к поиску
                        </Link>
                        <div className="ml-auto flex items-center gap-2">
                            {profile.category && (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${accent.badge} ${accent.badgeText}`}>
                                    {accent.icon}
                                    {profile.category.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* MAIN CONTENT - 2 Column Layout                         */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-4 max-w-6xl py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ── LEFT COLUMN: Sticky Sidebar (1/3) ── */}
                    <div className="w-full lg:w-[360px] flex-shrink-0">
                        <div className="lg:sticky lg:top-20 space-y-4">
                            {/* Photo Card */}
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                {/* Big Photo */}
                                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                                    {profile.image_url ? (
                                        <img
                                            src={profile.image_url}
                                            alt={profile.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <UserCircle className="w-24 h-24 text-gray-300" />
                                        </div>
                                    )}

                                    {/* Verified badge on photo */}
                                    {profile.is_verified && (
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-green-600 shadow-sm border border-green-100 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Проверен
                                        </div>
                                    )}
                                </div>

                                {/* Info below photo */}
                                <div className="p-6">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h1>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-bold text-amber-700">5.0</span>
                                        </div>
                                        <span className="text-sm text-gray-400">2 отзыва</span>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start gap-2 text-gray-600 mb-2">
                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                        <span className="text-sm">
                                            {profile.address ? `${profile.address}, ` : ''}{profile.city}
                                        </span>
                                    </div>

                                    {/* Show on map */}
                                    <a
                                        href={googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mb-6"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Показать на карте
                                    </a>

                                    {/* Languages */}
                                    {languages.length > 0 && (
                                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                                            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            {languages.map((lang: string) => {
                                                const info = LANG_FLAGS[lang.toUpperCase()];
                                                if (!info) return null;
                                                return (
                                                    <span
                                                        key={lang}
                                                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium"
                                                        title={info.label}
                                                    >
                                                        {info.flag} {lang.toUpperCase()}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Main CTA */}
                                    <button className={`w-full h-14 ${accent.primary} ${accent.primaryHover} text-white font-semibold text-lg rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:-translate-y-0.5`}>
                                        <Calendar className="w-5 h-5" />
                                        Забронировать
                                    </button>

                                    {/* Secondary actions */}
                                    <div className="flex gap-2 mt-3">
                                        <button className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm">
                                            <Phone className="w-4 h-4" />
                                            Позвонить
                                        </button>
                                        <button className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 text-sm">
                                            <MessageCircle className="w-4 h-4" />
                                            Написать
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">Статистика</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">На сервисе</span>
                                        <span className="font-medium text-gray-900">с {new Date(profile.created_at).getFullYear()} года</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Услуг</span>
                                        <span className="font-medium text-gray-900">{services.length}</span>
                                    </div>
                                    {cheapest && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Цена от</span>
                                            <span className="font-bold text-gray-900">€{Number(cheapest.price).toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="h-px bg-gray-100 my-4" />
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <ThumbsUp className="w-4 h-4 text-green-500" />
                                    <span>Рекомендуют 100% клиентов</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: Content (2/3) ── */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* ── About Section ── */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">О мастере</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Профессионал с многолетним опытом работы.
                                Индивидуальный подход к каждому клиенту, качественные материалы и внимание к деталям.
                                Работаю аккуратно и стерильно.
                                Буду рада видеть вас среди моих клиентов!
                            </p>

                            {/* Verification badges */}
                            <div className="flex flex-wrap gap-3 mt-6">
                                {profile.is_verified && (
                                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                        <Shield className="w-4 h-4" />
                                        Верифицирован
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    Паспорт проверен
                                </div>
                            </div>
                        </div>

                        {/* ── Services Section ── */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Услуги и цены</h2>
                                <span className="text-sm text-gray-400">{services.length} услуг</span>
                            </div>

                            {services.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {services.map((service: any) => (
                                        <div
                                            key={service.id}
                                            className="flex items-center justify-between py-5 group"
                                        >
                                            {/* Service info */}
                                            <div className="flex-1 min-w-0 mr-4">
                                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {service.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-sm text-gray-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {service.duration_min} мин
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price + Select */}
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-gray-900">
                                                        €{Number(service.price).toFixed(0)}
                                                    </span>
                                                </div>
                                                <button className={`${accent.selectBtn} ${accent.selectBtnHover} text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap`}>
                                                    Выбрать
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Euro className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500">Услуги пока не добавлены</p>
                                </div>
                            )}
                        </div>

                        {/* ── Reviews Section ── */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Отзывы</h2>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-400">2 отзыва</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {FAKE_REVIEWS.map((review, index) => (
                                    <div
                                        key={index}
                                        className={`${index < FAKE_REVIEWS.length - 1 ? 'pb-6 border-b border-gray-100' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${review.bg}`}>
                                                {review.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                                                <div className="text-xs text-gray-400">{review.date}</div>
                                            </div>
                                            {/* Stars */}
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: review.rating }).map((_, i) => (
                                                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed pl-[52px]">
                                            {review.text}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Write review CTA */}
                            <button className="w-full mt-8 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm">
                                Написать отзыв
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
