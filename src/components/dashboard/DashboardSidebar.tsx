'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    CalendarDays,
    Eye,
    BarChart2,
    Users,
    Contact,
    Star,
    UserCircle2,
    ChevronDown,
} from 'lucide-react';

type SectionKey =
    | 'bookings'
    | 'analytics'
    | 'services'
    | 'schedule'
    | 'staff'
    | 'clients'
    | 'reviews'
    | 'profile-general'
    | 'profile-location'
    | 'profile-notifications';

interface DashboardSidebarProps {
    currentSection: SectionKey;
    pendingCount: number;
    isSalonProvider: boolean;
    profileSlug: string;
}

const PROFILE_SUB_KEYS = new Set<SectionKey>([
    'profile-general',
    'services',
    'schedule',
    'profile-location',
    'profile-notifications',
]);

export function DashboardSidebar({
    currentSection,
    pendingCount,
    isSalonProvider,
    profileSlug,
}: DashboardSidebarProps) {
    const isOnProfileSubItem = PROFILE_SUB_KEYS.has(currentSection);
    const [isProfileOpen, setIsProfileOpen] = useState(isOnProfileSubItem);

    const mainNavItems = [
        { key: 'bookings' as const, label: 'Записи', icon: CalendarDays },
        { key: 'clients' as const, label: 'Клиенты', icon: Contact },
        { key: 'reviews' as const, label: 'Отзывы', icon: Star },
        { key: 'analytics' as const, label: 'Статистика', icon: BarChart2 },
        ...(isSalonProvider
            ? ([{ key: 'staff' as const, label: 'Сотрудники', icon: Users }] as const)
            : []),
    ];

    const profileSubItems = [
        { key: 'profile-general' as const, label: 'Основное' },
        { key: 'services' as const, label: 'Услуги' },
        { key: 'schedule' as const, label: 'Расписание' },
        { key: 'profile-location' as const, label: 'Локация' },
        { key: 'profile-notifications' as const, label: 'Уведомления' },
    ];

    return (
        <aside className="sticky top-6 hidden h-fit w-56 shrink-0 border-l border-gray-300 pl-8 md:block">
            <div className="bg-transparent">
                <div className="border-b border-gray-300 pb-4 mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        SVOI.DE
                    </p>
                    <h2 className="mt-1 text-sm font-bold text-slate-800">Кабинет мастера</h2>
                </div>

                <nav className="space-y-0.5">
                    <button
                        type="button"
                        onClick={() => setIsProfileOpen((prev) => !prev)}
                        aria-expanded={isProfileOpen}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                            isOnProfileSubItem
                                ? 'border-l-2 border-slate-900 text-slate-900'
                                : 'border-l-2 border-transparent text-stone-500 hover:text-slate-900'
                        }`}
                    >
                        <UserCircle2 className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left">Профиль</span>
                        <ChevronDown
                            className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ${
                                isProfileOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>

                    <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                            isProfileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                    >
                        <div className="overflow-hidden">
                            <div className="flex flex-col gap-0.5 mt-1">
                                {profileSubItems.map((sub) => {
                                    const isSubActive = currentSection === sub.key;
                                    return (
                                        <Link
                                            key={sub.key}
                                            href={`/dashboard?section=${sub.key}`}
                                            className={`flex items-center pl-10 pr-3 py-2 text-sm transition-colors border-l ${
                                                isSubActive
                                                    ? 'border-gray-900 text-gray-900'
                                                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="mr-2 text-stone-400">↳</span>
                                            {sub.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentSection === item.key;
                        return (
                            <Link
                                key={item.key}
                                href={`/dashboard?section=${item.key}`}
                                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                    isActive
                                        ? 'border-l-2 border-slate-900 text-slate-900'
                                        : 'border-l-2 border-transparent text-stone-500 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {item.label}
                                {item.key === 'bookings' && pendingCount > 0 && (
                                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full border border-amber-300 px-1.5 text-[10px] font-bold text-amber-700">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="my-3 border-t border-gray-300" />
                <Link
                    href={`/salon/${profileSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-stone-500 transition hover:text-slate-800"
                >
                    <Eye className="h-4 w-4 shrink-0" />
                    Посмотреть профиль
                </Link>
            </div>
        </aside>
    );
}
