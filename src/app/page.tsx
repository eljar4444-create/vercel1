'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, ArrowRight, Sparkles, Stethoscope,
    CalendarCheck, UserCheck, Star, ChevronRight,
    Shield, Clock, Heart, Dumbbell, GraduationCap
} from 'lucide-react';

// ─── Category Cards ─────────────────────────────────────────────────
const CATEGORIES = [
    {
        name: 'Красота',
        slug: 'beauty',
        description: 'Маникюр, парикмахерские услуги, уход и эстетика нового уровня',
        eyebrow: 'Most Popular',
        icon: Sparkles,
        spotlight: 'from-rose-500/20 via-fuchsia-500/10 to-white',
        iconWrap: 'from-rose-100 to-fuchsia-100',
        chipClass: 'bg-rose-100/65 text-rose-700 hover:bg-rose-200/70',
        iconClass: 'text-rose-600',
        layoutClass: 'md:col-span-2 md:row-span-2 md:min-h-[470px]',
        services: ['Маникюр', 'Педикюр', 'Парикмахер', 'Косметолог'],
    },
    {
        name: 'Медицина и Врачи',
        slug: 'health',
        description: 'Проверенные специалисты для диагностики, терапии и восстановления',
        eyebrow: 'Trusted Care',
        icon: Stethoscope,
        spotlight: 'from-teal-500/20 via-emerald-500/10 to-white',
        iconWrap: 'from-teal-100 to-emerald-100',
        chipClass: 'bg-teal-100/65 text-teal-700 hover:bg-teal-200/70',
        iconClass: 'text-teal-600',
        layoutClass: 'md:col-span-2 md:row-span-1 md:min-h-[220px]',
        services: ['Стоматолог', 'Терапевт', 'Массаж', 'Диагностика'],
    },
    {
        name: 'Спорт и Реабилитация',
        slug: 'sport',
        description: 'Тренировки, восстановление после нагрузок и персональный коучинг',
        eyebrow: 'Performance',
        icon: Dumbbell,
        spotlight: 'from-blue-500/20 via-indigo-500/10 to-white',
        iconWrap: 'from-blue-100 to-indigo-100',
        chipClass: 'bg-blue-100/65 text-blue-700 hover:bg-blue-200/70',
        iconClass: 'text-blue-600',
        layoutClass: 'md:col-span-1 md:row-span-1 md:min-h-[220px]',
        services: ['Фитнес', 'Реабилитация', 'Йога', 'Персональный тренер'],
    },
    {
        name: 'Обучение',
        slug: 'education',
        description: 'Частные занятия, языковые курсы и развитие профессиональных навыков',
        eyebrow: 'Growth',
        icon: GraduationCap,
        spotlight: 'from-amber-500/20 via-orange-500/10 to-white',
        iconWrap: 'from-amber-100 to-orange-100',
        chipClass: 'bg-amber-100/65 text-amber-700 hover:bg-amber-200/70',
        iconClass: 'text-amber-600',
        layoutClass: 'md:col-span-1 md:row-span-1 md:min-h-[220px]',
        services: ['Языки', 'Репетитор', 'Карьерный коуч', 'Мастер-классы'],
    },
];

// ─── How It Works ───────────────────────────────────────────────────
const STEPS = [
    {
        icon: <Search className="w-7 h-7" />,
        title: 'Выберите специалиста',
        description: 'Просмотрите профили мастеров, их отзывы, услуги и цены.',
        color: 'bg-blue-100 text-blue-600',
    },
    {
        icon: <CalendarCheck className="w-7 h-7" />,
        title: 'Забронируйте онлайн',
        description: 'Выберите удобную дату и время — без звонков и ожидания.',
        color: 'bg-violet-100 text-violet-600',
    },
    {
        icon: <UserCheck className="w-7 h-7" />,
        title: 'Получите услугу',
        description: 'Приходите к мастеру — он уже знает, когда вас ждать.',
        color: 'bg-emerald-100 text-emerald-600',
    },
];

// ─── Stats ──────────────────────────────────────────────────────────
const STATS = [
    { value: '100+', label: 'Мастеров', icon: <Star className="w-5 h-5" /> },
    { value: '500+', label: 'Услуг', icon: <Sparkles className="w-5 h-5" /> },
    { value: '4.9', label: 'Средний рейтинг', icon: <Heart className="w-5 h-5" /> },
];

// ═════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════
export default function HomePage() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HERO SECTION                                           */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/30 via-transparent to-teal-900/20" />

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }} />

                {/* Floating orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-4 max-w-6xl py-20 sm:py-28 lg:py-36">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm font-medium px-4 py-2 rounded-full mb-8">
                            <Sparkles className="w-4 h-4 text-rose-400" />
                            Сервис онлайн-бронирования в Германии
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                            Найди своего мастера
                            <span className="block bg-gradient-to-r from-rose-400 via-pink-400 to-teal-400 bg-clip-text text-transparent mt-2">
                                красоты и здоровья
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
                            Маникюр, стоматология, массаж — всё рядом с домом.
                            Бронируй в пару кликов.
                        </p>

                        {/* Search Bar */}
                        <form
                            onSubmit={handleSearch}
                            className="relative max-w-xl mx-auto"
                        >
                            <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-rose-500/20 focus-within:shadow-rose-500/10">
                                <Search className="w-5 h-5 text-gray-400 ml-5 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Маникюр, стоматолог, массаж..."
                                    className="flex-1 h-16 px-4 text-gray-900 text-base placeholder:text-gray-400 bg-transparent outline-none"
                                />
                                <button
                                    type="submit"
                                    className="h-12 px-7 mr-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-sm flex-shrink-0"
                                >
                                    Найти
                                </button>
                            </div>
                        </form>

                        {/* Quick links */}
                        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                            <span className="text-sm text-white/40">Популярное:</span>
                            {['Маникюр', 'Стоматолог', 'Массаж', 'Парикмахер'].map(tag => (
                                <Link
                                    key={tag}
                                    href={`/search?q=${encodeURIComponent(tag)}`}
                                    className="text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-all duration-200"
                                >
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 56h1440V28C1320 4 1200 0 1080 12 960 24 840 48 720 52 600 56 480 40 360 24 240 8 120 0 0 8v48z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* STATS BAR                                              */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="bg-white relative z-10 -mt-1">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center justify-center gap-8 sm:gap-16 py-6 border-b border-gray-100">
                        {STATS.map((stat, i) => (
                            <div key={i} className="flex items-center gap-3 text-center">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    {stat.icon}
                                </div>
                                <div className="text-left">
                                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                                    <div className="text-xs text-gray-400">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* POPULAR CATEGORIES                                     */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="bg-gradient-to-b from-white via-slate-50/40 to-white py-20 sm:py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Section header */}
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                            Популярные категории
                        </h2>
                        <p className="mx-auto max-w-md text-lg text-gray-500">
                            Выберите направление и найдите лучших специалистов
                        </p>
                    </div>

                    {/* Premium Bento Grid */}
                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-4 md:auto-rows-[220px]">
                        {CATEGORIES.map((cat, index) => {
                            const Icon = cat.icon;

                            return (
                                <Link
                                    key={cat.slug}
                                    href={`/search?category=${cat.slug}`}
                                    className={`group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:-translate-y-0.5 hover:from-white hover:to-slate-50 hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)] ${cat.layoutClass}`}
                                >
                                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.spotlight} opacity-90`} />
                                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/70 blur-3xl transition-transform duration-500 group-hover:scale-125" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/70 to-transparent" />

                                    <div className="relative">
                                        <div className="mb-6 flex items-start justify-between">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    {cat.eyebrow}
                                                </p>
                                                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${cat.iconWrap} ring-1 ring-white/80 shadow-sm ${cat.iconClass}`}>
                                                    <Icon className="h-8 w-8" />
                                                </div>
                                            </div>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-500 transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-slate-700">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </div>

                                        <h3 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
                                            {cat.name}
                                        </h3>
                                        <p className={`text-sm leading-relaxed text-slate-600 ${index === 0 ? 'max-w-xl' : ''}`}>
                                            {cat.description}
                                        </p>

                                        <div className="mt-6 flex flex-wrap gap-2.5">
                                            {cat.services.map((service) => (
                                                <span
                                                    key={service}
                                                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${cat.chipClass}`}
                                                >
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        <Link
                            href="/search"
                            className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-950 p-7 text-white shadow-[0_18px_60px_rgba(15,23,42,0.2)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(15,23,42,0.28)] md:col-span-2"
                        >
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_58%)]" />
                            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Explore</p>
                            <h3 className="relative mt-3 text-2xl font-bold tracking-tight">Все направления</h3>
                            <p className="relative mt-2 text-sm text-white/70">
                                Полный каталог специалистов по услугам и городам.
                            </p>
                            <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/90">
                                Открыть каталог
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </div>
                        </Link>
                    </div>

                    {/* Browse all */}
                    <div className="text-center mt-10">
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors group"
                        >
                            Смотреть всех специалистов
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HOW IT WORKS                                           */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="bg-gray-50/80 py-20">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Section header */}
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                            Как это работает
                        </h2>
                        <p className="text-gray-500 text-lg max-w-md mx-auto">
                            Три простых шага до идеального результата
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {STEPS.map((step, index) => (
                            <div key={index} className="relative text-center group">
                                {/* Connector line (hidden on mobile) */}
                                {index < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                                )}

                                {/* Step number + icon */}
                                <div className="relative inline-flex flex-col items-center">
                                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full text-xs font-bold text-gray-500 flex items-center justify-center z-10">
                                        {index + 1}
                                    </span>
                                    <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1`}>
                                        {step.icon}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* WHY US (Trust signals)                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="bg-white py-20">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50/50">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Проверенные мастера</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">Каждый специалист проходит верификацию и подтверждает квалификацию.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50/50">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Быстрое бронирование</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">Запишитесь онлайн за 30 секунд — без звонков и очередей.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50/50">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Star className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Реальные отзывы</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">Честные отзывы от клиентов помогут сделать правильный выбор.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* CTA FOR SPECIALISTS                                    */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                <div className="relative container mx-auto px-4 max-w-6xl py-20">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-white/70 text-sm font-medium px-4 py-2 rounded-full mb-6">
                            <Stethoscope className="w-4 h-4" />
                            Для специалистов
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                            Вы мастер?
                            <span className="block text-white/60 text-2xl sm:text-3xl mt-1">Присоединяйтесь к нам</span>
                        </h2>

                        <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                            Получайте новых клиентов, управляйте записями онлайн и развивайте свой бизнес вместе с нами.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/become-pro"
                                className="h-14 px-8 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-base rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                Стать партнёром
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/dashboard/2"
                                className="h-14 px-8 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Демо кабинета
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FOOTER                                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <footer className="bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl py-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-400">
                            © {new Date().getFullYear()} MasterBooking. Все права защищены.
                        </div>
                        <div className="flex items-center gap-6">
                            <Link href="/impressum" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                                Impressum
                            </Link>
                            <Link href="/search" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                                Поиск
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
