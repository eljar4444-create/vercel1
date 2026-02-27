'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, ArrowRight, Sparkles,
    CalendarCheck, UserCheck, Star,
    Shield, Clock, Heart, MapPin, Loader2, LocateFixed,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { POPULAR_SERVICES, getGermanCitySuggestions, resolveGermanCity } from '@/constants/searchSuggestions';
import { getHomeStats } from '@/app/actions/getHomeStats';

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

// ─── Quick search chips ──────────────────────────────────────────────
const QUICK_CHIPS = [
    { label: '✂️ Стрижка', query: 'Стрижка' },
    { label: '💅 Маникюр', query: 'Маникюр' },
    { label: '👁 Брови', query: 'Брови' },
    { label: '💆 Массаж', query: 'Массаж' },
    { label: '🌿 Косметология', query: 'Косметология' },
];

// ─── Testimonials ────────────────────────────────────────────────────
const TESTIMONIALS = [
    {
        name: 'Светлана К.',
        location: 'Берлин',
        service: 'Маникюр',
        text: 'Нашла мастера за 5 минут! Запись онлайн, никаких звонков. Результат превзошёл все ожидания.',
        avatar: 'https://i.pravatar.cc/48?u=svetlanak',
        rating: 5,
    },
    {
        name: 'Анна М.',
        location: 'Мюнхен',
        service: 'Стрижка',
        text: 'Отличный сервис. Мастер был пунктуален, цены прозрачные. Давно искала что-то подобное в Германии.',
        avatar: 'https://i.pravatar.cc/48?u=annam',
        rating: 5,
    },
    {
        name: 'Ольга Р.',
        location: 'Гамбург',
        service: 'Брови',
        text: 'Профессиональный подход, удобное расписание, быстрый ответ. Рекомендую всем русскоязычным!',
        avatar: 'https://i.pravatar.cc/48?u=olgar',
        rating: 5,
    },
];

// ════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════
export default function HomePage() {
    const formRef = useRef<HTMLFormElement>(null);
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [radius, setRadius] = useState('10');
    const [queryOpen, setQueryOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const [liveStats, setLiveStats] = useState({ masters: 0, services: 0 });
    const router = useRouter();

    useEffect(() => {
        getHomeStats().then(setLiveStats).catch(console.error);
    }, []);

    const filteredServices = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q
            ? POPULAR_SERVICES.filter((item) => item.toLowerCase().includes(q))
            : POPULAR_SERVICES;
        return base.slice(0, 8);
    }, [query]);

    const filteredCities = useMemo(() => {
        return getGermanCitySuggestions(city, 10);
    }, [city]);

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (!formRef.current?.contains(event.target as Node)) {
                setQueryOpen(false);
                setCityOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = query.trim();
        const normalizedCity = resolveGermanCity(city.trim()) || city.trim();
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (normalizedCity) params.set('city', normalizedCity);
        if (radius) params.set('radius', radius);
        router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const handleGeo = async () => {
        if (!navigator.geolocation || isGeoLoading) {
            toast.error('Геолокация недоступна в вашем браузере');
            return;
        }
        setIsGeoLoading(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                });
            });
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'de,en' } }
            );
            if (!response.ok) throw new Error('geo-failed');
            const data = await response.json();
            const address = data?.address || {};
            const rawCity = address.city || address.town || address.municipality || address.county || '';
            const resolved = resolveGermanCity(String(rawCity));
            if (!resolved) {
                toast.error('Ваш город не найден в базе. Выберите ближайший крупный город вручную');
                return;
            }
            setCity(resolved);
            setCityOpen(false);
            toast.success(`Определен город: ${resolved}`);
        } catch (error) {
            if ((error as GeolocationPositionError)?.code === 1) {
                toast.error('Доступ к геолокации запрещен');
            } else {
                toast.error('Не удалось определить город автоматически');
            }
        } finally {
            setIsGeoLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">

            {/* ══════════════════════════════════════════════════════ */}
            {/* HERO                                                   */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden">
                {/* Background image */}
                <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=80"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black/85" />

                {/* Main content */}
                <div className="relative z-10 w-full px-4 pb-24 pt-8 text-center">
                    <div className="mx-auto max-w-4xl">

                        {/* Eyebrow tag */}
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                            Маркетплейс бьюти-услуг в Германии
                        </div>

                        {/* Headline */}
                        <h1 className="font-display mb-4 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
                            Найди своего{' '}
                            <br className="hidden sm:block" />
                            <span className="italic text-yellow-400">бьюти‑мастера</span>
                        </h1>

                        <p className="mx-auto mb-8 max-w-lg text-base text-white/65 sm:text-lg">
                            Маникюр, стрижка, массаж — быстро, просто, 24/7
                        </p>

                        {/* ── Search Form ── */}
                        <form
                            ref={formRef}
                            onSubmit={handleSearch}
                            className="mx-auto max-w-3xl"
                        >
                            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30">
                                <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_auto_auto]">

                                    {/* Service input */}
                                    <div className="relative flex h-15 items-center gap-2 border-b border-gray-100 px-4 py-4 md:border-b-0 md:border-r">
                                        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                                        <input
                                            type="text"
                                            value={query}
                                            onFocus={() => { setQueryOpen(query.trim().length > 0); setCityOpen(false); }}
                                            onChange={(e) => { const v = e.target.value; setQuery(v); setQueryOpen(v.trim().length > 0); }}
                                            placeholder="Маникюр, стрижка, массаж..."
                                            aria-label="Услуга или специалист"
                                            className="h-full w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                                        />
                                        {queryOpen && query.trim().length > 0 && filteredServices.length > 0 && (
                                            <div className="absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                                <ul className="max-h-56 overflow-y-auto py-1">
                                                    {filteredServices.map((item) => (
                                                        <li key={item}>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setQuery(item); setQueryOpen(false); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {item}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* City input */}
                                    <div className="relative flex h-15 items-center gap-2 border-b border-gray-100 px-4 py-4 md:border-b-0 md:border-r">
                                        <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                                        <input
                                            type="text"
                                            value={city}
                                            onFocus={() => { setCityOpen(city.trim().length > 0); setQueryOpen(false); }}
                                            onChange={(e) => { const v = e.target.value; setCity(v); setCityOpen(v.trim().length > 0); }}
                                            placeholder="Ваш город"
                                            aria-label="Город"
                                            className="h-full w-full bg-transparent pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                                        />
                                        <button
                                            type="button"
                                            title="Определить мой город"
                                            aria-label="Определить мой город"
                                            onClick={handleGeo}
                                            className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            {isGeoLoading
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <LocateFixed className="h-4 w-4" />
                                            }
                                        </button>
                                        {cityOpen && city.trim().length > 0 && filteredCities.length > 0 && (
                                            <div className="absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                                <ul className="max-h-56 overflow-y-auto py-1">
                                                    {filteredCities.map((item) => (
                                                        <li key={item}>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setCity(item); setCityOpen(false); }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {item}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Radius */}
                                    <div className="flex h-15 items-center gap-2 border-b border-gray-100 px-4 py-4 md:border-b-0 md:border-r">
                                        <label htmlFor="search-radius" className="text-xs font-medium text-gray-400 whitespace-nowrap">
                                            Радиус
                                        </label>
                                        <select
                                            id="search-radius"
                                            value={radius}
                                            onChange={(e) => setRadius(e.target.value)}
                                            className="cursor-pointer bg-transparent text-sm font-semibold text-gray-800 outline-none"
                                        >
                                            <option value="5">5 км</option>
                                            <option value="10">10 км</option>
                                            <option value="20">20 км</option>
                                            <option value="30">30 км</option>
                                            <option value="50">50 км</option>
                                        </select>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        className="h-15 bg-yellow-400 px-8 text-sm font-bold text-black transition-colors hover:bg-yellow-300"
                                    >
                                        Найти
                                    </button>
                                </div>
                            </div>

                            {/* Quick chips */}
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {QUICK_CHIPS.map((chip) => (
                                    <button
                                        key={chip.query}
                                        type="button"
                                        onClick={() => router.push(`/search?q=${encodeURIComponent(chip.query)}`)}
                                        className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/40"
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── Stats strip (glass, pinned to bottom) ── */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="mx-auto flex max-w-3xl items-center justify-around gap-4 px-6 py-4 sm:gap-0">
                        <div className="flex items-center gap-2 text-white">
                            <Star className="h-4 w-4 shrink-0 text-yellow-400" aria-hidden="true" />
                            <div>
                                <div className="text-sm font-bold leading-none sm:text-base">{liveStats.masters || 0}</div>
                                <div className="mt-0.5 text-[10px] text-white/55 sm:text-xs">Мастеров</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <Sparkles className="h-4 w-4 shrink-0 text-yellow-400" aria-hidden="true" />
                            <div>
                                <div className="text-sm font-bold leading-none sm:text-base">{liveStats.services || 0}</div>
                                <div className="mt-0.5 text-[10px] text-white/55 sm:text-xs">Услуг</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <Clock className="h-4 w-4 shrink-0 text-yellow-400" aria-hidden="true" />
                            <div>
                                <div className="text-sm font-bold leading-none sm:text-base">24/7</div>
                                <div className="mt-0.5 text-[10px] text-white/55 sm:text-xs">Онлайн-запись</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* ══════════════════════════════════════════════════════ */}
            {/* HOW IT WORKS                                           */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto max-w-5xl px-4">
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
                </div>
            </section>


            {/* ══════════════════════════════════════════════════════ */}
            {/* CTA FOR SPECIALISTS                                    */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-gray-900 py-24">
                {/* Decorative glows */}
                <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />
                <div aria-hidden="true" className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/5 blur-3xl" />

                <div className="relative mx-auto max-w-2xl px-4 text-center">
                    {/* Eyebrow */}
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                        <Sparkles className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                        Для специалистов
                    </div>

                    <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
                        Вы мастер?
                        <span className="mt-1 block text-2xl font-semibold text-white/40 sm:text-3xl">
                            Присоединяйтесь к нам
                        </span>
                    </h2>

                    <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-white/45 sm:text-lg">
                        Получайте новых клиентов, управляйте записями онлайн и развивайте свой бизнес вместе с нами.
                    </p>

                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/auth/register?role=provider"
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20"
                        >
                            Стать партнёром
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                        >
                            Найти мастера
                        </Link>
                    </div>

                    {/* Trust strip */}
                    <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-white/35">
                        <span className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                            Бесплатная регистрация
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5" aria-hidden="true" />
                            Без абонентской платы
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            Поддержка 24/7
                        </span>
                    </div>
                </div>
            </section>

        </div>
    );
}
