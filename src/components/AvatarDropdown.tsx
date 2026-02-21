'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { LogOut, UserCircle2, CalendarClock, LayoutDashboard, Shield, User, MessageCircle, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AvatarDropdownProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string | null;
        profileId?: number | null;
    } | null;
}

export function getRoleLabel(role?: string | null) {
    if (role === 'ADMIN') return 'Администратор';
    if (role === 'PROVIDER') return 'Мастер';
    return 'Клиент';
}

export function getRoleMenuLinks(user: {
    role?: string | null;
    profileId?: number | null;
}) {
    const role = user.role || 'CLIENT';
    const providerDashboardLink = user.profileId ? `/dashboard/${user.profileId}` : '/provider/onboarding';
    const providerPublicLink = user.profileId ? `/profile/${user.profileId}` : '/provider/onboarding';

    return role === 'ADMIN'
        ? [
            { href: '/admin', label: 'Панель управления', icon: Shield },
            { href: '/account/settings', label: 'Настройки аккаунта', icon: Settings },
        ]
        : role === 'PROVIDER'
            ? [
                { href: providerDashboardLink, label: 'Кабинет мастера', icon: LayoutDashboard },
                { href: providerPublicLink, label: 'Моя страница', icon: UserCircle2 },
                { href: '/account/settings', label: 'Настройки аккаунта', icon: Settings },
            ]
            : [
                { href: '/account', label: 'Личный кабинет', icon: UserCircle2 },
                { href: '/my-bookings', label: 'Мои записи', icon: CalendarClock },
                { href: '/account/settings', label: 'Настройки аккаунта', icon: Settings },
            ];
}

export function AvatarDropdown({ user: propUser }: AvatarDropdownProps) {
    const [resolvedProfileId, setResolvedProfileId] = useState<number | null | undefined>(propUser?.profileId);

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
        if (!propUser || propUser.role !== 'PROVIDER' || resolvedProfileId) return;

        let active = true;
        fetch('/api/me/provider-profile', { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!active || !data) return;
                setResolvedProfileId(data.profileId ?? null);
            })
            .catch(() => {
                if (active) setResolvedProfileId(null);
            });

        return () => {
            active = false;
        };
    }, [propUser, resolvedProfileId]);

    if (!propUser) return null;

    const roleLinks = getRoleMenuLinks({
        role: propUser.role,
        profileId: resolvedProfileId ?? null,
    });

    return (
        <Popover>
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
                <div className="bg-gradient-to-b from-gray-50 to-white p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{propUser.name || 'Пользователь'}</p>
                        <Badge variant="outline" className="border-gray-200 bg-white text-[10px] font-medium text-gray-600">
                            {getRoleLabel(propUser.role)}
                        </Badge>
                    </div>
                    <p className="truncate text-xs text-gray-500">{propUser.email || 'Без email'}</p>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="p-2">
                    {roleLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href + link.label}
                                href={link.href}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <Icon className="h-4 w-4 text-gray-400" />
                                {link.label}
                            </Link>
                        );
                    })}
                    <Link
                        href="/chat"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
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
