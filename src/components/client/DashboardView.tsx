'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, MapPin, MessageCircle, Clock, Wallet, UserRound, ArrowRight, Settings, Heart, Navigation, Store, Plus, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CancelBookingForm } from '@/components/client/CancelBookingForm';

export interface BookingItem {
    id: number;
    date: string;
    time: string;
    status: string;
    isFuture: boolean;
    isCancellable: boolean;
    profile: {
        id: number;
        slug: string;
        name: string;
        city: string;
        address: string | null;
        image_url: string | null;
        phone: string | null;
    };
    service: {
        id: number;
        title: string;
        price: number;
        duration_min: number;
    } | null;
}

interface DashboardViewProps {
    user: {
        id: string;
        name: string | null;
        email: string | null;
    };
    upcoming: BookingItem[];
    history: BookingItem[];
    stats: {
        totalBookings: number;
        favoriteCategory: string | null;
    };
    recommendedCategories: { id: number; name: string; slug: string; icon: string | null }[];
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        confirmed: {
            label: 'Подтверждено',
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        cancelled: {
            label: 'Отменена',
            cls: 'bg-red-50 text-red-600 border-red-200',
        },
    };

    const meta = map[status] ?? {
        label: 'Ожидает',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
            {meta.label}
        </span>
    );
}

function ProfileAvatar({ src, name }: { src: string | null; name: string }) {
    if (src) {
        return (
            <Image
                src={src}
                alt={name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover border border-slate-100"
            />
        );
    }
    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
            <UserRound className="h-5 w-5 text-slate-400" />
        </div>
    );
}

export function DashboardView({ user, upcoming, history, stats, recommendedCategories }: DashboardViewProps) {
    const firstName = user.name?.split(' ')[0] || '';

    // Unique masters from history
    const myMastersMap = new Map<number, BookingItem['profile']>();
    history.forEach(b => {
        if (!myMastersMap.has(b.profile.id) && b.status === 'confirmed') {
            myMastersMap.set(b.profile.id, b.profile);
        }
    });
    const myMasters = Array.from(myMastersMap.values());
    const nextAppointment = upcoming.length > 0 ? upcoming[0] : null;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {firstName ? `Привет, ${firstName}! 👋` : 'Добро пожаловать! 👋'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">{user.email}</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content Area (70%) */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">

                    {nextAppointment ? (
                        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-indigo-500" />
                                        Ближайшая запись
                                    </h2>
                                    <StatusBadge status={nextAppointment.status} />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <ProfileAvatar src={nextAppointment.profile.image_url} name={nextAppointment.profile.name} />
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {nextAppointment.service?.title || 'Услуга'}
                                            </h3>
                                            <Link href={`/salon/${nextAppointment.profile.slug}`} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                                                {nextAppointment.profile.name}
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <CalendarDays className="h-4 w-4 text-slate-400" />
                                                <span>{formatDate(nextAppointment.date)} в {nextAppointment.time}</span>
                                            </div>
                                            {(nextAppointment.service?.price || nextAppointment.service?.duration_min) && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Wallet className="h-4 w-4 text-slate-400" />
                                                    <span>
                                                        {nextAppointment.service?.price ? `€${nextAppointment.service.price}` : ''}
                                                        {nextAppointment.service?.price && nextAppointment.service?.duration_min ? ' • ' : ''}
                                                        {nextAppointment.service?.duration_min ? `${nextAppointment.service.duration_min} мин` : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {nextAppointment.profile.address && (
                                                <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                                                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{nextAppointment.profile.address}, {nextAppointment.profile.city}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 flex flex-wrap items-center gap-3">
                                            {nextAppointment.profile.address && (
                                                <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                                                    <a href={`https://maps.google.com/?q=${encodeURIComponent(`${nextAppointment.profile.address}, ${nextAppointment.profile.city}`)}`} target="_blank" rel="noopener noreferrer">
                                                        <Navigation className="w-4 h-4 mr-2" />
                                                        Проложить маршрут
                                                    </a>
                                                </Button>
                                            )}
                                            {nextAppointment.profile.phone && (
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={`https://wa.me/${nextAppointment.profile.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                                        <MessageCircle className="w-4 h-4 mr-2" />
                                                        Написать мастеру
                                                    </a>
                                                </Button>
                                            )}
                                            {nextAppointment.isCancellable && (
                                                <div className="ml-auto">
                                                    <CancelBookingForm bookingId={nextAppointment.id} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                                <CalendarDays className="h-8 w-8 text-indigo-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">У вас пока нет предстоящих записей</h2>
                            <p className="mx-auto max-w-sm text-slate-500 mb-6">
                                Если вы планируете визит, рекомендуем записаться заранее.
                            </p>
                            {recommendedCategories.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Рекомендуем сегодня</h3>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {recommendedCategories.map(cat => (
                                            <Link key={cat.id} href={`/search?category=${cat.slug}`} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-sm font-medium text-slate-700">
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Link href="/search">Найти мастера</Link>
                            </Button>
                        </div>
                    )}

                    {/* History and Favorites Tabs */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <Tabs defaultValue="history" className="w-full">
                            <div className="px-6 pt-6 border-b border-slate-100">
                                <TabsList className="bg-transparent space-x-6 pb-2">
                                    <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 pb-3 text-base font-semibold data-[state=inactive]:text-slate-500">
                                        История посещений
                                        <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600">
                                            {history.length}
                                        </span>
                                    </TabsTrigger>
                                    <TabsTrigger value="masters" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 pb-3 text-base font-semibold data-[state=inactive]:text-slate-500">
                                        Мои мастера
                                        <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-600">
                                            {myMasters.length}
                                        </span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="history" className="p-0">
                                {history.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-sm">История посещений пуста</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {history.map(b => (
                                            <div key={b.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start hover:bg-slate-50 transition-colors">
                                                <div className="shrink-0">
                                                    <ProfileAvatar src={b.profile.image_url} name={b.profile.name} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-semibold text-slate-900 truncate">{b.service?.title || 'Услуга'}</h4>
                                                        <StatusBadge status={b.status} />
                                                    </div>
                                                    <Link href={`/salon/${b.profile.slug}`} className="text-sm text-slate-500 hover:text-slate-900">{b.profile.name}</Link>
                                                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                                                        <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(b.date)}</span>
                                                        {b.service?.price && <span className="font-medium text-slate-900">€{b.service.price}</span>}
                                                    </div>
                                                </div>
                                                <div className="sm:ml-4 shrink-0 mt-3 sm:mt-0">
                                                    {b.status !== 'cancelled' ? (
                                                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                                                            <Link href={`/salon/${b.profile.slug}`}>Повторить запись</Link>
                                                        </Button>
                                                    ) : (
                                                        <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto text-slate-500 hover:text-slate-900">
                                                            <Link href={`/salon/${b.profile.slug}`}>Профиль</Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="masters" className="p-6">
                                {myMasters.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-sm">У вас пока нет сохраненных мастеров</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {myMasters.map(master => (
                                            <Link key={master.id} href={`/salon/${master.slug}`} className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/50">
                                                <ProfileAvatar src={master.image_url} name={master.name} />
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{master.name}</h4>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{master.city}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                </div>

                {/* Sidebar (30%) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Stats Widget */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Ваша статистика</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Всего визитов</p>
                                    <p className="text-lg font-bold text-slate-900">{stats.totalBookings}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                    <Store className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Любимая категория</p>
                                    <p className="text-lg font-bold text-slate-900 truncate">{stats.favoriteCategory || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Quick Access */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4">Настройки</h3>
                        <Link href="/account/settings" className="group block p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <Settings className="w-4 h-4 text-slate-600" />
                                </div>
                                <h4 className="font-semibold text-slate-900">Профиль и аккаунт</h4>
                            </div>
                            <p className="text-sm text-slate-500">Управление личными данными, номером телефона и email.</p>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
