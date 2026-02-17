import prisma from '@/lib/prisma';
import Link from 'next/link';
import {
    Calendar, Banknote, LayoutDashboard, ArrowRight,
    Users, TrendingUp, Shield, Star, ChevronLeft
} from 'lucide-react';
import { ProRegistrationForm } from '@/components/ProRegistrationForm';

export const dynamic = 'force-dynamic';

// ─── Benefits ───────────────────────────────────────────────────────
const BENEFITS = [
    {
        icon: <Calendar className="w-7 h-7" />,
        title: 'Удобный график',
        description: 'Клиенты бронируют онлайн, вы тратите ноль времени на звонки и мессенджеры.',
        color: 'bg-blue-50 text-blue-600',
    },
    {
        icon: <Banknote className="w-7 h-7" />,
        title: 'Без комиссии',
        description: 'Мы не берём процент с ваших услуг. Все деньги — ваши.',
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        icon: <LayoutDashboard className="w-7 h-7" />,
        title: 'Личный кабинет',
        description: 'Управляйте заявками, услугами и профилем из одного места.',
        color: 'bg-violet-50 text-violet-600',
    },
];

// ─── Social proof ───────────────────────────────────────────────────
const PROOF_STATS = [
    { icon: <Users className="w-5 h-5" />, value: '100+', label: 'Мастеров уже с нами' },
    { icon: <Star className="w-5 h-5" />, value: '4.9', label: 'Средний рейтинг' },
    { icon: <TrendingUp className="w-5 h-5" />, value: '500+', label: 'Бронирований в месяц' },
];

export default async function BecomeProPage() {
    // ─── Fetch categories from DB ───────────────────────────────────
    let categories: { id: number; name: string; slug: string; icon: string | null }[] = [];
    try {
        categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    } catch { /* fallback to empty */ }

    return (
        <div className="min-h-screen bg-white">

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TOP NAV                                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex items-center h-14 gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            На главную
                        </Link>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HERO + FORM (Split layout)                             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* Subtle background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-50/50 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

                <div className="relative container mx-auto px-4 max-w-6xl py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                        {/* ── Left: Hero content ── */}
                        <div className="lg:sticky lg:top-24">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                Бесплатная регистрация
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                                Находите новых клиентов
                                <span className="block text-gray-400 mt-1">с Svoi.de</span>
                            </h1>

                            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
                                Зарегистрируйтесь бесплатно, заполните профиль и начните принимать
                                онлайн-записи уже сегодня. Без комиссии, без обязательств.
                            </p>

                            {/* Benefits */}
                            <div className="space-y-5">
                                {BENEFITS.map((b, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-2xl ${b.color} flex items-center justify-center flex-shrink-0`}>
                                            {b.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-0.5">{b.title}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">{b.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social proof */}
                            <div className="flex items-center gap-6 sm:gap-10 mt-12 pt-8 border-t border-gray-100">
                                {PROOF_STATS.map((s, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Right: Form ── */}
                        <div>
                            <ProRegistrationForm categories={categories} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HOW IT WORKS                                           */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="bg-gray-50/80 py-20">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Как начать работу</h2>
                        <p className="text-gray-500">Три шага до первого клиента</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                        {[
                            { step: '1', title: 'Заполните форму', desc: 'Укажите имя, город и категорию. Это займёт 30 секунд.' },
                            { step: '2', title: 'Пройдите модерацию', desc: 'Наша команда проверит заявку и активирует ваш профиль.' },
                            { step: '3', title: 'Принимайте заявки', desc: 'Клиенты находят вас, бронируют онлайн, а вы управляете записями.' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BOTTOM CTA                                             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="bg-white py-16">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
                        Есть вопросы?
                    </h2>
                    <p className="text-gray-500 mb-8">
                        Напишите нам — мы поможем с регистрацией и настройкой профиля.
                    </p>
                    <Link
                        href="mailto:info@svoi.de"
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        Связаться с нами
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
