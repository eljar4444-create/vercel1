import Image from 'next/image';
import Link from 'next/link';
import {
    Search, ArrowRight, Sparkles,
    CalendarCheck, UserCheck, Star,
    Heart, User,
} from 'lucide-react';
import HomeHero from '@/components/HomeHero';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import TopMastersSection from '@/components/TopMastersSection';

const ScrollReveal = dynamic(() => import('@/components/ScrollReveal'), { ssr: true });

// ─── How It Works ───────────────────────────────────────────────────
const STEPS = [
    {
        icon: <Search className="w-7 h-7" />,
        title: 'Найдите своего мастера',
        description: 'Ищите лучших специалистов по маникюру, стрижкам и массажу рядом с вами.',
        color: 'bg-blue-100 text-blue-600',
    },
    {
        icon: <CalendarCheck className="w-7 h-7" />,
        title: 'Выберите удобное время',
        description: 'Смотрите актуальное расписание и записывайтесь онлайн 24/7 без лишних звонков.',
        color: 'bg-violet-100 text-violet-600',
    },
    {
        icon: <Star className="w-7 h-7" />,
        title: 'Наслаждайтесь результатом',
        description: 'Оставляйте честные отзывы после визита и помогайте другим сделать правильный выбор.',
        color: 'bg-emerald-100 text-emerald-600',
    },
];

const CATEGORIES = [
    { name: 'Стрижка и укладка', query: 'Стрижка', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&q=80' },
    { name: 'Маникюр', query: 'Маникюр', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80' },
    { name: 'Массаж', query: 'Массаж', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&q=80' },
    { name: 'Косметология', query: 'Косметология', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80' },
    { name: 'Брови и ресницы', query: 'Брови', image: 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=500&q=80' },
    { name: 'Барбершоп', query: 'Барбершоп', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&q=80' },
];

// ════════════════════════════════════════════════════════════════════
// PAGE (Server Component)
// ════════════════════════════════════════════════════════════════════
export default function HomePage() {

    return (
        <div className="min-h-screen bg-transparent">

            {/* ══════════════════════════════════════════════════════ */}
            {/* HERO — Client component with search bar               */}
            {/* ══════════════════════════════════════════════════════ */}
            <HomeHero />

            {/* ══════════════════════════════════════════════════════ */}
            {/* POPULAR CATEGORIES                                     */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="bg-white py-16 md:py-24">
                <ScrollReveal className="container mx-auto max-w-7xl px-4 md:px-8">
                    <h2 className="mb-8 text-2xl font-bold text-neutral-900 md:text-3xl text-center mx-auto w-full">
                        Популярные направления
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {CATEGORIES.map((category) => (
                            <Link
                                key={category.name}
                                href={`/search?q=${encodeURIComponent(category.query)}`}
                                className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl"
                            >
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <span className="absolute bottom-4 left-4 right-4 text-sm font-medium leading-tight text-white md:text-base">
                                    {category.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            {/* ══════════════════════════════════════════════════════ */}
            {/* TOP MASTERS (from Prisma DB)                           */}
            {/* ══════════════════════════════════════════════════════ */}
            <Suspense fallback={<div className="h-96 w-full animate-pulse bg-[#F8F9FA]" />}>
                <TopMastersSection />
            </Suspense>

            {/* ══════════════════════════════════════════════════════ */}
            {/* HOW IT WORKS                                           */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="bg-transparent py-20">
                <ScrollReveal className="container mx-auto max-w-5xl px-4">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Как это работает
                        </h2>
                        <p className="mt-3 text-gray-500">
                            Три простых шага до идеального результата
                        </p>
                    </div>

                    <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
                        {/* Dashed connector line (desktop) */}
                        <div
                            aria-hidden="true"
                            className="absolute top-10 hidden h-px w-[calc(66%-64px)] border-t-2 border-dashed border-gray-200 md:block"
                            style={{ left: 'calc(16.5% + 40px)' }}
                        />

                        {STEPS.map((step, index) => (
                            <div key={index} className="group flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${step.color} transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:shadow-xl`}>
                                        {step.icon}
                                    </div>
                                    {/* Yellow step number badge */}
                                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black shadow-sm">
                                        {index + 1}
                                    </span>
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                                <p className="max-w-xs text-sm leading-relaxed text-gray-500">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            {/* ══════════════════════════════════════════════════════ */}
            {/* CTA FOR SPECIALISTS (Redesigned)                       */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="py-16 md:py-24 px-4">
                <ScrollReveal className="max-w-5xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-16 text-center flex flex-col items-center">
                    <span className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-4">
                        Для мастеров и салонов красоты
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Развивайте свой бьюти-бизнес вместе с нами
                    </h2>
                    <p className="text-lg text-slate-300 mb-10 max-w-2xl">
                        Получите удобную CRM-систему, календарь онлайн-записей 24/7, уведомления в Telegram и новых клиентов. Начните работу на платформе абсолютно бесплатно.
                    </p>
                    <Link
                        href="/auth/register?role=provider"
                        className="inline-block bg-white text-slate-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-slate-100 transition-colors"
                    >
                        Зарегистрироваться
                    </Link>
                </ScrollReveal>
            </section>

        </div>
    );
}
