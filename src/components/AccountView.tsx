'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Compass, CalendarClock, Sparkles, Settings } from 'lucide-react';

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
    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-300">Client Area</p>
                <h1 className="mt-2 text-3xl font-bold">
                    {user.name ? `Привет, ${user.name}!` : 'Добро пожаловать!'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-300">
                    Здесь вы управляете профилем и записями: находите мастеров, бронируете время и отслеживаете визиты.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/10 px-4 py-3">
                        <p className="text-[11px] text-gray-300">Всего записей</p>
                        <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3">
                        <p className="text-[11px] text-gray-300">Предстоящие</p>
                        <p className="text-2xl font-bold">{stats.upcomingBookings}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3">
                        <p className="text-[11px] text-gray-300">Статус</p>
                        <p className="text-lg font-semibold">{user.role === 'CLIENT' ? 'Клиент' : user.role}</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild className="bg-[#fc0] text-black hover:bg-[#e6b800]">
                        <Link href="/search">
                            <Compass className="mr-2 h-4 w-4" />
                            Найти мастера
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                        <Link href="/my-bookings">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Мои записи
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                        <Link href="/account/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Настройки аккаунта
                        </Link>
                    </Button>
                </div>
            </div>

            {stats.totalBookings === 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h2 className="text-sm font-bold text-blue-900">Что делать дальше</h2>
                    <div className="mt-3 grid gap-2 text-sm text-blue-900 sm:grid-cols-3">
                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                            <span className="font-semibold">1.</span> Выберите услугу в поиске
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                            <span className="font-semibold">2.</span> Забронируйте удобный слот
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                            <span className="font-semibold">3.</span> Следите за записью в кабинете
                        </div>
                    </div>
                    <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href="/search">Перейти к поиску</Link>
                    </Button>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Подсказка
                </div>
                <p className="mt-2">
                    В разделе «Настройки аккаунта» можно обновить имя, аватар и информацию «О себе».
                </p>
            </div>
        </div>
    );
}
