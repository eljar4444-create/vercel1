'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    LogOut, LayoutDashboard, Shield, User, MessageCircle, Settings,
    ChevronDown, CalendarDays, BarChart2, Briefcase, Clock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AvatarDropdownProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string | null;
        profileId?: number | null;
        profileSlug?: string | null;
    } | null;
}

export function getRoleLabel(role?: string | null, profileId?: number | null) {
    if (role === 'ADMIN') return 'Администратор';
    if (profileId) return 'Мастер';
    return 'Клиент';
}

export function AvatarDropdown({ user: propUser }: AvatarDropdownProps) {
    const [resolvedProfileId, setResolvedProfileId] = useState<number | null | undefined>(propUser?.profileId);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const initials =
        propUser?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';

    useEffect(() => {
        setResolvedProfileId(propUser?.profileId);
    }, [propUser?.profileId]);

    useEffect(() => {
        if (!propUser || !resolvedProfileId) return;

        let active = true;
        fetch('/api/me/provider-profile', { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!active || !data) return;
                setResolvedProfileId(data.profileId ?? null);
                if (propUser && data.profileSlug) {
                    propUser.profileSlug = data.profileSlug;
                }
            })
            .catch(() => {
                if (active) setResolvedProfileId(null);
            });

        return () => {
            active = false;
        };
    }, [propUser, resolvedProfileId]);

    if (!propUser) return null;

    const isProvider = !!resolvedProfileId;
    const isAdmin = propUser.role === 'ADMIN';
    const dashboardBase = resolvedProfileId ? `/dashboard/${resolvedProfileId}` : '/provider/onboarding';

    const dashboardSubLinks = resolvedProfileId
        ? [
            { href: `${dashboardBase}?section=bookings`, label: 'Записи', icon: CalendarDays },
            { href: `${dashboardBase}?section=analytics`, label: 'Статистика', icon: BarChart2 },
            { href: `${dashboardBase}?section=services`, label: 'Услуги', icon: Briefcase },
            { href: `${dashboardBase}?section=schedule`, label: 'Расписание', icon: Clock },
        ]
        : [];

    const closeAll = () => {
        setPopoverOpen(false);
        setIsDashboardOpen(false);
    };

    return (
        <Popover open={popoverOpen} onOpenChange={(open) => { setPopoverOpen(open); if (!open) setIsDashboardOpen(false); }}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="rounded-full border border-gray-200 bg-white p-0.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                    aria-label="Открыть меню пользователя"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={propUser.image || undefined} alt={propUser.name || 'User'} />
                        <AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
                            {propUser.image ? <User className="h-4 w-4" /> : initials}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-72 overflow-hidden border-gray-200 bg-white/95 p-0 backdrop-blur supports-[backdrop-filter]:bg-white/90">
                {/* User info header */}
                <div className="bg-gradient-to-b from-gray-50 to-white p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{propUser.name || 'Пользователь'}</p>
                        <Badge variant="outline" className="border-gray-200 bg-white text-[10px] font-medium text-gray-600">
                            {getRoleLabel(propUser.role, resolvedProfileId)}
                        </Badge>
                    </div>
                    <p className="truncate text-xs text-gray-500">{propUser.email || 'Без email'}</p>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="p-2">
                    {/* ADMIN links */}
                    {isAdmin && (
                        <>
                            <Link href="/admin" onClick={closeAll} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                                <Shield className="h-4 w-4 text-gray-400" />
                                Панель управления
                            </Link>
                        </>
                    )}

                    {/* PROVIDER: accordion for dashboard */}
                    {isProvider && (
                        <>
                            <div className="flex items-center gap-0 rounded-lg hover:bg-gray-50 transition-colors">
                                <Link
                                    href={dashboardBase}
                                    onClick={closeAll}
                                    className="flex flex-1 items-center gap-2 px-3 py-2 text-sm text-gray-700"
                                >
                                    <LayoutDashboard className="h-4 w-4 text-gray-400" />
                                    Кабинет мастера
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsDashboardOpen((prev) => !prev)}
                                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors mr-1"
                                    aria-label="Показать разделы кабинета"
                                >
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${isDashboardOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </div>

                            {/* Accordion sub-links */}
                            {isDashboardOpen && dashboardSubLinks.length > 0 && (
                                <div className="mb-1 flex flex-col space-y-0.5 rounded-lg bg-gray-50 px-2 py-1.5">
                                    {dashboardSubLinks.map((sub) => {
                                        const Icon = sub.icon;
                                        return (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                onClick={closeAll}
                                                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
                                            >
                                                <Icon className="h-3.5 w-3.5 text-gray-400" />
                                                {sub.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* CLIENT: dashboard link */}
                    {!isProvider && !isAdmin && (
                        <Link href="/dashboard" onClick={closeAll} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                            <LayoutDashboard className="h-4 w-4 text-gray-400" />
                            Мой кабинет
                        </Link>
                    )}

                    {/* Common links */}
                    <Link href="/account/settings" onClick={closeAll} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                        <Settings className="h-4 w-4 text-gray-400" />
                        Настройки аккаунта
                    </Link>
                    <Link href="/chat" onClick={closeAll} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                        Чат
                    </Link>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="p-2">
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4" />
                        Выйти
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
