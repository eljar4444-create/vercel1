'use client';

import Link from 'next/link';
import { CalendarClock, Heart, Settings, ArrowRight } from 'lucide-react';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    role: string;
}

interface AccountViewProps {
    user: User;
    stats: {
        totalBookings: number;
        upcomingBookings: number;
    };
}

export function AccountView({ user, stats }: AccountViewProps) {
    const firstName = user.name?.split(' ')[0] || '';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {firstName ? `Привет, ${firstName}! 👋` : 'Добро пожаловать! 👋'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">{user.email}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                    href="/my-bookings"
                    className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <CalendarClock className="h-5 w-5 text-blue-600" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">{stats.upcomingBookings}</p>
                    <p className="text-sm text-slate-500">Мои записи</p>
                </Link>

                <Link
                    href="/search"
                    className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                            <Heart className="h-5 w-5 text-rose-500" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">{stats.totalBookings}</p>
                    <p className="text-sm text-slate-500">Всего визитов</p>
                </Link>

                <Link
                    href="/account/settings"
                    className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                            <Settings className="h-5 w-5 text-slate-600" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">Настройки</p>
                    <p className="text-sm text-slate-500">Профиль и аккаунт</p>
                </Link>
            </div>

            {stats.totalBookings === 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                        <CalendarClock className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">У вас пока нет записей</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                        Найдите мастера и забронируйте удобное время
                    </p>
                    <Link
                        href="/search"
                        className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                        Найти мастера
                    </Link>
                </div>
            )}
        </div>
    );
}
