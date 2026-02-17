'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, ArrowRight, Sparkles, Stethoscope,
    CalendarCheck, UserCheck, Star, ChevronRight,
    Shield, Clock, Heart
} from 'lucide-react';

// ─── Category Cards ─────────────────────────────────────────────────
const CATEGORIES = [
    {
        name: 'Красота',
        emoji: '💅',
        slug: 'beauty',
        description: 'Маникюр, причёски, макияж, уход за лицом',
        gradient: 'from-rose-500 to-pink-600',
        bgLight: 'bg-rose-50',
        hover: 'hover:shadow-rose-200',
        services: ['Маникюр', 'Педикюр', 'Парикмахер', 'Косметолог'],
    },
    {
        name: 'Медицина и Врачи',
        emoji: '🏥',
        slug: 'health',
        description: 'Стоматология, терапия, массаж, диагностика',
        gradient: 'from-teal-500 to-emerald-600',
        bgLight: 'bg-teal-50',
        hover: 'hover:shadow-teal-200',
        services: ['Стоматолог', 'Терапевт', 'Массаж', 'Диагностика'],
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
            <section className="bg-white py-20">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Section header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                            Популярные категории
                        </h2>
                        <p className="text-gray-500 text-lg max-w-md mx-auto">
                            Выберите направление и найдите лучших специалистов
                        </p>
                    </div>

                    {/* Category grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.slug}
                                href={`/search?category=${cat.slug}`}
                                className={`group relative bg-white rounded-2xl border border-gray-100 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cat.hover}`}
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="text-5xl">{cat.emoji}</div>
                                    <div className={`w-10 h-10 ${cat.bgLight} rounded-full flex items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                                    {cat.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-5">{cat.description}</p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {cat.services.map(s => (
                                        <span key={s} className={`${cat.bgLight} text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg`}>
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                {/* Bottom gradient line */}
                                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            </Link>
                        ))}
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
                                href="/auth/register"
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
