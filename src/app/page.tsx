'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search, ArrowRight, Sparkles,
    CalendarCheck, UserCheck, Star,
    Shield, Clock, Heart, MapPin, Loader2, LocateFixed
} from 'lucide-react';
import toast from 'react-hot-toast';
import { POPULAR_SERVICES, getGermanCitySuggestions, resolveGermanCity } from '@/constants/searchSuggestions';

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
    const formRef = useRef<HTMLFormElement>(null);
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [radius, setRadius] = useState('10');
    const [queryOpen, setQueryOpen] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const router = useRouter();

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
        <div className="min-h-screen bg-white font-sans">

            <section className="relative flex h-[600px] w-full flex-col items-center justify-center overflow-hidden md:h-[70vh]">
                <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=80"
                    alt="Beauty salon interior"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />

                <div className="relative z-10 w-full px-4">
                    <div className="mx-auto max-w-5xl text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                            Найди своего бьюти-мастера
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
                            Маникюр, стрижка, массаж — быстро, просто, 24/7
                        </p>

                        <form
                            ref={formRef}
                            onSubmit={handleSearch}
                            className="relative mx-auto mt-8 max-w-4xl"
                        >
                            <div className="rounded-2xl bg-white p-2 shadow-2xl md:rounded-full md:p-3">
                                <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1.3fr_1fr_auto_auto]">
                                    <div className="relative flex h-14 items-center rounded-xl border border-transparent bg-white px-3 md:border-r md:border-r-gray-100 md:rounded-r-none">
                                        <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
                                        <input
                                            type="text"
                                            value={query}
                                            onFocus={() => {
                                                setQueryOpen(query.trim().length > 0);
                                                setCityOpen(false);
                                            }}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setQuery(next);
                                                setQueryOpen(next.trim().length > 0);
                                            }}
                                            placeholder="Маникюр, стрижка, массаж, салон..."
                                            className="h-full w-full bg-transparent px-3 text-base text-gray-900 placeholder:text-gray-400 outline-none"
                                        />
                                        {queryOpen && query.trim().length > 0 && filteredServices.length > 0 && (
                                            <div className="absolute left-0 top-full z-[60] mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                                <ul className="max-h-64 overflow-y-auto">
                                                    {filteredServices.map((item) => (
                                                        <li key={item}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setQuery(item);
                                                                    setQueryOpen(false);
                                                                }}
                                                                className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {item}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative flex h-14 items-center rounded-xl border border-transparent bg-white px-3 md:rounded-none">
                                        <MapPin className="h-5 w-5 flex-shrink-0 text-gray-400" />
                                        <input
                                            type="text"
                                            value={city}
                                            onFocus={() => {
                                                setCityOpen(city.trim().length > 0);
                                                setQueryOpen(false);
                                            }}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setCity(next);
                                                setCityOpen(next.trim().length > 0);
                                            }}
                                            placeholder="Город"
                                            className="h-full w-full bg-transparent px-3 pr-9 text-base text-gray-900 placeholder:text-gray-400 outline-none"
                                        />
                                        <button
                                            type="button"
                                            title="Определить мой город"
                                            aria-label="Определить мой город"
                                            onClick={handleGeo}
                                            className="absolute right-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                                        >
                                            {isGeoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                                        </button>
                                        {cityOpen && city.trim().length > 0 && filteredCities.length > 0 && (
                                            <div className="absolute left-0 top-full z-[60] mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                                                <ul className="max-h-64 overflow-y-auto">
                                                    {filteredCities.map((item) => (
                                                        <li key={item}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCity(item);
                                                                    setCityOpen(false);
                                                                }}
                                                                className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                {item}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex h-14 items-center rounded-xl bg-gray-50 px-3 md:justify-center">
                                        <label htmlFor="search-radius" className="mr-2 text-sm font-medium text-gray-500">
                                            Радиус
                                        </label>
                                        <select
                                            id="search-radius"
                                            value={radius}
                                            onChange={(e) => setRadius(e.target.value)}
                                            className="bg-transparent text-sm font-semibold text-gray-800 outline-none"
                                        >
                                            <option value="5">5 км</option>
                                            <option value="10">10 км</option>
                                            <option value="20">20 км</option>
                                            <option value="30">30 км</option>
                                            <option value="50">50 км</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="h-12 rounded-xl bg-black px-8 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 md:rounded-full"
                                    >
                                        Найти
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
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
                            <Sparkles className="w-4 h-4" />
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
                                href="/auth/register?role=provider"
                                className="h-14 px-8 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-base rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                Стать партнёром
                                <ArrowRight className="w-5 h-5" />
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
