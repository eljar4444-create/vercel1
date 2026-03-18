'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import {
    AvatarDropdown,
    getContinueOnboardingHref,
    getRoleLabel,
    hasIncompleteProviderOnboarding,
} from '@/components/AvatarDropdown';
import { Menu, X, MessageCircle, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm';

const QUICK_BEAUTY_LINKS = [
    { label: 'Стрижка', href: '/search?q=Стрижка' },
    { label: 'Маникюр', href: '/search?q=Маникюр' },
    { label: 'Брови и ресницы', href: '/search?q=Брови и ресницы' },
    { label: 'Косметология', href: '/search?q=Косметология' },
    { label: 'Массаж', href: '/search?q=Массаж' },
];

type HeaderProps = {
    variant?: 'default' | 'minimal';
};

export function Header({ variant = 'default' }: HeaderProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession(); // removed status
    const isAuthPage = pathname?.startsWith('/auth');
    const isBecomeProPage = pathname === '/become-pro';
    const isOnboardingPage = pathname?.startsWith('/onboarding');
    const isSearchPage = pathname === '/search';
    const resolvedVariant = variant === 'minimal' || pathname === '/become-pro' ? 'minimal' : 'default';
    const isMinimal = resolvedVariant === 'minimal';
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const user = session?.user;
    const hasIncompleteOnboarding = hasIncompleteProviderOnboarding(user);
    const continueOnboardingHref = getContinueOnboardingHref(user);
    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';


    if (isAuthPage || isBecomeProPage) return null;

    // REUSABLE AVATAR DROPDOWN
    // ... (Avatar render logic can stay, but need to check if AvatarDropdown uses legacy stuff)
    // Actually, AvatarDropdown is imported, let's keep using it if it's safe.

    return (
        <header className={cn(
            "relative z-50 transition-all duration-300",
            isMinimal
                ? "bg-[#F5F2EB]/95 backdrop-blur-md border-b border-stone-200"
                : pathname === '/'
                ? scrolled
                    ? "bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-white/10"
                    : "bg-transparent border-b border-transparent"
                : "bg-[#F5F2EB]/90 backdrop-blur-md border-b border-stone-200"
        )}>
            <div
                className={cn(
                    isMinimal
                        ? "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
                        : "container mx-auto flex h-16 w-full items-center gap-4 px-4 max-w-7xl lg:grid lg:grid-cols-[1fr_minmax(0,560px)_1fr]"
                )}
            >
                {/* Left Area (Logo) */}
                <div className={cn("flex items-center justify-start", isMinimal ? "shrink-0" : "flex-1")}>
                    <Link href="/" className="relative z-10 m-0 flex shrink-0 items-center p-0 leading-none">
                        <img src="/logo.svg" alt="Svoi.de" className="block h-16 w-auto object-contain" />
                    </Link>
                </div>

                {isSearchPage && !isMinimal && !isOnboardingPage ? (
                    <div className="hidden lg:block flex-1 min-w-0">
                        <SearchFiltersForm
                            categoryFilter={typeof searchParams.get('category') === 'string' ? searchParams.get('category') || undefined : undefined}
                            queryFilter={typeof searchParams.get('q') === 'string' ? searchParams.get('q') || undefined : undefined}
                            cityFilter={typeof searchParams.get('city') === 'string' ? searchParams.get('city') || undefined : undefined}
                            radiusFilter={typeof searchParams.get('radius') === 'string' ? searchParams.get('radius') || undefined : undefined}
                        />
                    </div>
                ) : null}

                {!isSearchPage && !isMinimal && !isOnboardingPage ? (
                    <nav className="hidden lg:flex flex-1 items-center justify-center shrink-0 gap-6 lg:gap-8">
                        {QUICK_BEAUTY_LINKS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors whitespace-nowrap",
                                    "text-slate-900 hover:text-slate-600"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                ) : null}

                {/* Right Actions */}
                <div className={cn("flex items-center justify-end", isMinimal ? "shrink-0" : "flex-1 gap-2")}>
                    {isMinimal ? (
                        <div className="flex items-center">
                            <Link
                                href="/auth/login"
                                className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 whitespace-nowrap"
                            >
                                Войти
                            </Link>
                        </div>
                    ) : user ? (
                        <div className="hidden items-center gap-2 lg:flex">
                            {!isOnboardingPage ? (
                                <Link
                                    href="/chat"
                                    aria-label="Открыть чат"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </Link>
                            ) : null}
                            <AvatarDropdown user={user} />
                        </div>
                    ) : (
                        <div className="hidden items-center gap-3 lg:flex">
                            <Link
                                href="/become-pro"
                                className="hidden xl:inline-block text-sm font-semibold transition-opacity hover:opacity-80 whitespace-nowrap text-slate-900"
                            >
                                Для мастеров
                            </Link>
                            <Link
                                href="/auth/login"
                                className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                            >
                                Для клиента
                            </Link>
                        </div>
                    )}

                    {!isMinimal && !isOnboardingPage ? (
                        <button
                            type="button"
                            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-900 transition-colors hover:bg-gray-50 lg:hidden"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    ) : null}
                </div>
            </div>

            {mobileMenuOpen && !isMinimal && (
                <div className="border-t border-gray-100 bg-[#F5F2EB] px-4 pb-4 pt-3 shadow-sm lg:hidden">
                    <div className="mx-auto max-w-7xl space-y-2">
                        <Link
                            href="/search"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Поиск
                        </Link>
                        {!user && (
                            <Link
                                href="/become-pro"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Для мастеров
                            </Link>
                        )}
                        {user && (
                            <Link
                                href="/chat"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <MessageCircle className="h-4 w-4 text-gray-400" />
                                Чат
                            </Link>
                        )}

                        <div className="my-2 h-px bg-gray-100" />

                        {user ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                                        <AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-900">{user.name || 'Пользователь'}</p>
                                        <p className="truncate text-xs text-gray-500">{user.email || 'Без email'}</p>
                                    </div>
                                    <Badge variant="outline" className="border-gray-200 bg-white text-[10px] font-medium text-gray-600">
                                        {getRoleLabel(user)}
                                    </Badge>
                                </div>

                                {hasIncompleteOnboarding && (
                                    <Link
                                        href={continueOnboardingHref}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md bg-stone-50 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100"
                                    >
                                        Продолжить настройку профиля
                                    </Link>
                                )}
                                {user.role === 'ADMIN' && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Панель управления
                                    </Link>
                                )}
                                {user.profileId && !hasIncompleteOnboarding && (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Кабинет мастера
                                    </Link>
                                )}
                                {(!user.profileId || hasIncompleteOnboarding) && user.role !== 'ADMIN' && (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        Мой кабинет
                                    </Link>
                                )}
                                <Link
                                    href="/account/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Настройки аккаунта
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        signOut({ callbackUrl: '/' });
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Выйти
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    href="/auth/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex w-full items-center justify-center h-10 rounded-xl bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                                >
                                    Для клиента
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header >
    );
}
