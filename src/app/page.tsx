'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, ArrowRight, Sparkles,
    CalendarCheck, UserCheck, Star,
    Shield, Clock, Heart, MapPin, Loader2, LocateFixed,
    ShieldCheck, Zap, MessageSquare, LayoutDashboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { POPULAR_SERVICES, getGermanCitySuggestions, resolveGermanCity } from '@/constants/searchSuggestions';
import { getHomeStats } from '@/app/actions/getHomeStats';
import { useLocalStorageSearch } from '@/hooks/useLocalStorageSearch';

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

const BENEFITS = [
    {
        icon: <ShieldCheck className="w-6 h-6 text-slate-700" />,
        title: 'Проверенные мастера и салоны красоты',
    },
    {
        icon: <Zap className="w-6 h-6 text-slate-700" />,
        title: 'Мгновенная онлайн-запись',
    },
    {
        icon: <MessageSquare className="w-6 h-6 text-slate-700" />,
        title: 'Реальные отзывы клиентов',
    },
    {
        icon: <LayoutDashboard className="w-6 h-6 text-slate-700" />,
        title: 'Управление бронированиями в личном кабинете',
    },
];

// ─── Stats ──────────────────────────────────────────────────────────

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
    const [isFocused, setIsFocused] = useState(false);

    const SPOTLIGHT_SUGGESTIONS = [
        'Стрижка', 'Маникюр', 'Окрашивание', 'Массаж спины', 'Лазерная эпиляция',
        'Педикюр', 'Брови и ресницы', 'Укладка волос', 'Макияж', 'Шугаринг',
        'Массаж лица', 'Косметология'
    ];
    const [liveStats, setLiveStats] = useState({ masters: 0, services: 0 });
    const router = useRouter();
    const { getStored, setStored } = useLocalStorageSearch();

    useEffect(() => {
        getHomeStats().then(setLiveStats).catch(console.error);
    }, []);

    // Память поиска: подставляем последние город и запрос только на клиенте
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = getStored();
        if (stored.city) setCity(stored.city);
        if (stored.query) setQuery(stored.query);
    }, [getStored]);

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
        setStored(normalizedCity, trimmed);
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
        <div className="min-h-screen bg-transparent">

            {/* ══════════════════════════════════════════════════════ */}
            {/* HERO — Fresha-style, beige gradient                   */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="relative w-full h-screen overflow-hidden flex flex-col justify-center">
                <video
                    src="/hero-bg.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-black/20" />

                <div className="relative z-20 flex flex-col items-center text-center px-4 w-full max-w-4xl mx-auto -translate-y-8 md:-translate-y-12">

                    {/* Headline */}
                    <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-[72px] animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both" style={{ animationDelay: '0ms' }}>
                        Забронируй местного
                        <br />
                        бьюти‑мастера
                    </h1>

                    {/* Subtitle */}
                    <p className="mx-auto mb-12 max-w-2xl text-base text-white/90 sm:text-lg animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both" style={{ animationDelay: '150ms' }}>
                        Лучшие парикмахеры, мастера маникюра, массажисты и бьюти-эксперты —
                        которым доверяют тысячи клиентов по всей Германии
                    </p>

                    {/* ── Search bar ── */}
                    <div className="relative mx-auto max-w-5xl w-full">
                        <form ref={formRef} onSubmit={handleSearch} className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
                            <div className={`flex flex-col items-stretch rounded-2xl bg-white ring-1 md:flex-row md:items-center md:rounded-full transition-all duration-300 ease-out origin-center ${isFocused
                                ? 'scale-[1.05] shadow-[0_8px_40px_rgba(0,0,0,0.25)] ring-white/30 ring-4'
                                : 'scale-100 shadow-[0_2px_24px_rgba(0,0,0,0.10)] ring-[#E8D9C8]'
                                }`}>

                                {/* Service field */}
                                <div className="relative flex flex-1 items-center gap-4 border-b border-gray-100 px-6 py-5 md:border-b-0 md:border-r">
                                    <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                                    <input
                                        type="text"
                                        value={query}
                                        onFocus={() => { setIsFocused(true); setQueryOpen(query.trim().length > 0); setCityOpen(false); }}
                                        onBlur={() => { setTimeout(() => { setIsFocused(false); setQueryOpen(false); }, 200); }}
                                        onChange={(e) => { const v = e.target.value; setQuery(v); setQueryOpen(v.trim().length > 0); }}
                                        placeholder="Все процедуры и специалисты"
                                        aria-label="Услуга или специалист"
                                        className="w-full bg-transparent text-base text-gray-900 placeholder:text-gray-400 outline-none"
                                    />
                                    {queryOpen && query.trim().length > 0 && filteredServices.length > 0 && (
                                        <div className="absolute left-0 top-full z-[60] mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                            <ul className="max-h-56 overflow-y-auto py-1">
                                                {filteredServices.map((item) => (
                                                    <li key={item}>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setQuery(item); setQueryOpen(false); setIsFocused(false); }}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F5F2EB]"
                                                        >
                                                            {item}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* ── Spotlight suggestions dropdown ── */}
                                    {isFocused && query.trim().length === 0 && (
                                        <div className="absolute left-0 top-full z-[60] mt-4 w-full rounded-2xl bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 border border-gray-100 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                                            <div className="flex flex-col gap-1 w-full">
                                                {SPOTLIGHT_SUGGESTIONS.map((sug) => (
                                                    <button
                                                        key={sug}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => { setQuery(sug); setIsFocused(false); setQueryOpen(false); }}
                                                        className="w-full text-left pl-[3.25rem] pr-6 py-2.5 hover:bg-slate-50 transition-colors rounded-xl flex items-center text-sm font-medium tracking-wide text-slate-600 hover:text-slate-900 cursor-pointer"
                                                    >
                                                        <span className="truncate">{sug}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* City field */}
                                <div className="relative flex flex-1 items-center gap-4 border-b border-gray-100 px-6 py-5 md:border-b-0 md:border-r">
                                    <MapPin className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                                    <input
                                        type="text"
                                        value={city}
                                        onFocus={() => { setCityOpen(city.trim().length > 0); setQueryOpen(false); }}
                                        onChange={(e) => { const v = e.target.value; setCity(v); setCityOpen(v.trim().length > 0); }}
                                        placeholder="Текущее местоположение"
                                        aria-label="Город"
                                        className="w-full bg-transparent pr-9 text-base text-gray-900 placeholder:text-gray-400 outline-none"
                                    />
                                    <button
                                        type="button"
                                        title="Определить мой город"
                                        aria-label="Определить мой город"
                                        onClick={handleGeo}
                                        className="absolute right-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                    >
                                        {isGeoLoading
                                            ? <Loader2 className="h-5 w-5 animate-spin" />
                                            : <LocateFixed className="h-5 w-5" />
                                        }
                                    </button>
                                    {cityOpen && city.trim().length > 0 && filteredCities.length > 0 && (
                                        <div className="absolute left-0 top-full z-[60] mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                            <ul className="max-h-56 overflow-y-auto py-1">
                                                {filteredCities.map((item) => (
                                                    <li key={item}>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setCity(item); setCityOpen(false); }}
                                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#F5F2EB]"
                                                        >
                                                            {item}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Radius field */}
                                <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5 md:border-b-0 md:border-r">
                                    <Clock className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                                    <select
                                        id="search-radius"
                                        value={radius}
                                        onChange={(e) => setRadius(e.target.value)}
                                        className="cursor-pointer bg-transparent text-base text-gray-700 outline-none"
                                    >
                                        <option value="5">5 км</option>
                                        <option value="10">10 км</option>
                                        <option value="20">20 км</option>
                                        <option value="30">30 км</option>
                                        <option value="50">50 км</option>
                                    </select>
                                </div>

                                {/* Submit */}
                                <div className="p-2.5">
                                    <button
                                        type="submit"
                                        className="w-full rounded-full bg-gray-900 px-10 py-4 text-base font-bold text-white transition-colors hover:bg-gray-700 md:w-auto"
                                    >
                                        Найти
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Stats line */}
                    <p className="mt-6 text-sm text-white/80 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '450ms' }}>
                        <span className="font-bold text-white">
                            {(liveStats.masters || 0).toLocaleString('de-DE')}
                        </span>{' '}
                        мастеров уже с нами сегодня
                    </p>
                </div >
            </section >



            {/* ══════════════════════════════════════════════════════ */}
            {/* HOW IT WORKS                                           */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="bg-transparent py-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
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
            {/* BENEFITS                                               */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="bg-slate-50 py-20">
                <div className="container mx-auto max-w-5xl px-4">
                    <div className="mb-14 text-center">
                        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                            Преимущества
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
                        {BENEFITS.map((benefit, index) => (
                            <div key={index} className="flex flex-col items-center text-center p-6 rounded-3xl bg-white shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900">{benefit.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════ */}
            {/* CTA FOR SPECIALISTS                                    */}
            {/* ══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-slate-900 border-t border-slate-800 py-24">
                {/* Decorative glows */}
                <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />
                <div aria-hidden="true" className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/5 blur-3xl" />

                <div className="relative mx-auto max-w-2xl px-4 text-center">
                    <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
                        Вы бьюти-мастер или владелец салона?
                    </h2>

                    <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-slate-300 sm:text-lg">
                        Присоединяйтесь к Svoi.de. Получите удобную CRM-систему, онлайн-запись, уведомления в Telegram и новых клиентов абсолютно бесплатно.
                    </p>

                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/auth/register?role=provider"
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-3.5 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20"
                        >
                            Подключить профиль
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

        </div >
    );
}
