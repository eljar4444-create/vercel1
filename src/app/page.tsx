import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import {
    ArrowRight,
    CalendarCheck,
    Clock3,
    MapPin,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    UserCheck,
} from 'lucide-react';
import HomeHero from '@/components/HomeHero';
import TopMastersSection from '@/components/TopMastersSection';

const ScrollReveal = nextDynamic(() => import('@/components/ScrollReveal'), { ssr: true });

export const dynamic = 'force-dynamic';

const TRUST_METRICS = [
    { value: '24/7', label: 'онлайн-запись без звонков' },
    { value: 'DE', label: 'крупные города Германии' },
    { value: 'Top', label: 'мастера, отзывы и профили' },
    { value: 'Fast', label: 'быстрый поиск по услуге и району' },
];

const FEATURE_COLUMNS = [
    {
        eyebrow: 'Для клиентов',
        title: 'Поиск без хаоса в чатах и сторис',
        description: 'Найдите мастера по услуге, городу и свободному окну. Сравнивайте профили, цены и отзывы в одном месте.',
        points: [
            'Удобный поиск по категориям и городам',
            'Актуальные профили с понятными услугами',
            'Онлайн-запись и быстрый повторный визит',
        ],
        accent: 'from-[#fff4cc] via-[#ffe291] to-[#ffc83d]',
    },
    {
        eyebrow: 'Для мастеров',
        title: 'Лидогенерация и рабочий кабинет в одной платформе',
        description: 'Покажите свои услуги, принимайте записи и ведите клиентов без ручного администрирования в мессенджерах.',
        points: [
            'Публичный профиль с услугами и ценами',
            'Календарь, статусы записей и уведомления',
            'Поток новых клиентов из органического поиска',
        ],
        accent: 'from-[#d6f5ea] via-[#ade9d0] to-[#74d8b1]',
    },
];

const DISCOVERY_CARDS = [
    {
        title: 'Волосы',
        href: '/search?q=Стрижка',
        description: 'Стрижка, укладка, окрашивание и уход.',
        services: ['Стрижка', 'Окрашивание', 'Укладка'],
    },
    {
        title: 'Ногтевой сервис',
        href: '/search?q=Маникюр',
        description: 'Маникюр, педикюр и укрепление ногтей.',
        services: ['Маникюр', 'Педикюр', 'Наращивание'],
    },
    {
        title: 'Лицо и кожа',
        href: '/search?q=Косметология',
        description: 'Косметология, чистки, уход и anti-age процедуры.',
        services: ['Чистка лица', 'Пилинг', 'Уход'],
    },
    {
        title: 'Расслабление',
        href: '/search?q=Массаж',
        description: 'Массаж, восстановление и body-care ритуалы.',
        services: ['Массаж', 'Лимфодренаж', 'SPA'],
    },
];

const PROCESS_STEPS = [
    {
        icon: Search,
        title: 'Выберите услугу',
        description: 'Введите процедуру или направление, которое вам нужно прямо сейчас.',
    },
    {
        icon: MapPin,
        title: 'Уточните город',
        description: 'Система подберет мастеров рядом и покажет доступные профили.',
    },
    {
        icon: CalendarCheck,
        title: 'Запишитесь онлайн',
        description: 'Откройте профиль специалиста, выберите время и подтвердите запись.',
    },
];

const BENEFITS = [
    {
        icon: ShieldCheck,
        title: 'Прозрачные профили',
        text: 'Услуги, цены, фото и описание мастера собраны в одном месте.',
    },
    {
        icon: Clock3,
        title: 'Быстрое решение',
        text: 'Меньше переписок и уточнений, больше понятных действий.',
    },
    {
        icon: UserCheck,
        title: 'Фокус на доверии',
        text: 'Отзывы и публичный профиль помогают выбрать уверенно.',
    },
    {
        icon: TrendingUp,
        title: 'Рост для специалистов',
        text: 'Новый канал привлечения клиентов без тяжелого запуска.',
    },
];

const CITY_PILLS = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Düsseldorf'];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-transparent">
            <HomeHero />

            <section className="relative overflow-hidden bg-[#f7f1e6] py-8">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
                <ScrollReveal className="container mx-auto max-w-7xl px-4 md:px-8">
                    <div className="grid gap-4 md:grid-cols-4">
                        {TRUST_METRICS.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-3xl border border-black/5 bg-white/70 px-5 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur"
                            >
                                <div className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{item.value}</div>
                                <div className="mt-1 text-sm text-slate-600">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            <section className="relative overflow-hidden bg-[#fcfaf6] py-20 md:py-24">
                <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[#ffe7a3]/50 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#dff7ee] blur-3xl" />
                <ScrollReveal className="container relative mx-auto max-w-7xl px-4 md:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                            <Sparkles className="h-4 w-4" />
                            Svoi.de
                        </span>
                        <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                            Сайт для поиска и записи к бьюти-специалистам в Германии
                        </h2>
                        <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg">
                            Платформа помогает клиентам быстро находить мастеров, а специалистам получать
                            понятный поток заявок и управлять расписанием без лишней рутины.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 lg:grid-cols-2">
                        {FEATURE_COLUMNS.map((column) => (
                            <div
                                key={column.title}
                                className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
                            >
                                <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${column.accent}`} />
                                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{column.eyebrow}</div>
                                <h3 className="mt-4 max-w-lg text-2xl font-black tracking-tight text-slate-950">{column.title}</h3>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">{column.description}</p>
                                <div className="mt-8 space-y-3">
                                    {column.points.map((point) => (
                                        <div key={point} className="flex items-start gap-3 text-sm text-slate-700">
                                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900" />
                                            <span>{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            <section className="bg-white py-20 md:py-24">
                <ScrollReveal className="container mx-auto max-w-7xl px-4 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Популярные направления</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                                Начните с самой востребованной категории
                            </h2>
                        </div>
                        <Link href="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-600">
                            Смотреть все категории
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {DISCOVERY_CARDS.map((card, index) => (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,209,102,0.22),_transparent_40%),linear-gradient(180deg,_#ffffff,_#f8f4ec)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1.5"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                                    0{index + 1}
                                </div>
                                <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950">{card.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {card.services.map((service) => (
                                        <span
                                            key={service}
                                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                                        >
                                            {service}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    Перейти в поиск
                                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            <Suspense fallback={<div className="h-96 w-full animate-pulse bg-[#F8F9FA]" />}>
                <TopMastersSection />
            </Suspense>

            <section className="bg-[#f5efe3] py-20 md:py-24">
                <ScrollReveal className="container mx-auto max-w-6xl px-4 md:px-8">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Как это работает</p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                            От запроса до записи за несколько шагов
                        </h2>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {PROCESS_STEPS.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.title}
                                    className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                                    </div>
                                    <h3 className="mt-8 text-xl font-black tracking-tight text-slate-950">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </ScrollReveal>
            </section>

            <section className="bg-[#0f172a] py-20 text-white md:py-24">
                <ScrollReveal className="container mx-auto max-w-7xl px-4 md:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">Почему платформа удобнее</p>
                            <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight md:text-4xl">
                                Не просто витрина, а рабочий сайт с реальной пользой
                            </h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                                Клиент получает понятный сценарий выбора. Мастер получает публичную страницу,
                                заказы и базовую операционную систему для записи.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {CITY_PILLS.map((city) => (
                                    <span key={city} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                                        {city}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                            {BENEFITS.map((benefit) => {
                                const Icon = benefit.icon;
                                return (
                                    <div key={benefit.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-bold">{benefit.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-white/70">{benefit.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            <section className="bg-[linear-gradient(180deg,#fff7dd_0%,#fff 100%)] px-4 py-16 md:px-8 md:py-24">
                <ScrollReveal className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-black/5 bg-slate-950 px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:px-14 md:py-16">
                    <Star className="mx-auto h-8 w-8 text-[#ffd166]" />
                    <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
                        Запустите поиск или подключите свой салон к платформе
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-lg">
                        Для клиентов это быстрый способ найти мастера. Для специалистов это полноценный сайт-присутствие
                        с записью, карточкой услуг и новым трафиком.
                    </p>
                    <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/search"
                            className="inline-flex items-center justify-center rounded-full bg-[#ffd166] px-7 py-4 text-sm font-bold text-slate-950 transition-colors hover:bg-[#ffc43d]"
                        >
                            Найти мастера
                        </Link>
                        <Link
                            href="/become-pro"
                            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                        >
                            Стать партнёром
                        </Link>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
}
