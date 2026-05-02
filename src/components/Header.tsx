'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
    AvatarDropdown,
    getContinueOnboardingHref,
    hasIncompleteProviderOnboarding,
    useRoleLabel,
} from '@/components/AvatarDropdown';
import { Menu, X, MessageCircle, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm';

type HeaderProps = {
    variant?: 'default' | 'minimal';
};

export function Header({ variant = 'default' }: HeaderProps) {
    const t = useTranslations('header');
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
    const roleLabel = useRoleLabel(user);
    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';

    const quickBeautyLinks = [
        { label: t('nav.services'), href: '/#services' },
        { label: t('nav.masters'), href: '/#masters' },
        { label: t('nav.about'), href: '/about' },
    ];

    if (isAuthPage || isBecomeProPage) return null;

    const isHomepage = pathname === '/';

    return (
        <header className={cn(
            "z-50 transition-all duration-300 pt-[env(safe-area-inset-top)]",
            isHomepage ? "fixed top-0 w-full" : "relative",
            isHomepage
                ? cn(scrolled ? "bg-[#160e0a]/90 backdrop-blur-md shadow-sm" : "bg-transparent")
                : "bg-[#1A1514]"
        )}>
            <div
                className={cn(
                    isMinimal
                        ? "mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
                        : isHomepage
                        ? cn("flex justify-between items-center px-8 max-w-screen-2xl mx-auto transition-all duration-300", scrolled ? "py-4" : "py-6")
                        : isSearchPage
                        ? "container mx-auto flex h-16 w-full items-center gap-4 px-4 max-w-7xl lg:grid lg:grid-cols-[1fr_minmax(0,560px)_1fr]"
                        : "flex justify-between items-center px-8 max-w-screen-2xl mx-auto py-5"
                )}
            >
                {/* Left Area (Logo) */}
                <div className={cn("flex items-center justify-start", isMinimal ? "shrink-0" : "flex-1")}>
                    <Link href="/" className="relative z-10 m-0 flex shrink-0 items-center p-0 leading-none">
                        <span className="text-2xl font-black tracking-tighter text-white">SVOI</span>
                    </Link>
                </div>

                {isSearchPage && !isMinimal && !isOnboardingPage ? (
                    <div className="hidden lg:block flex-1 min-w-0">
                        <SearchFiltersForm
                            categoryFilter={typeof searchParams.get('category') === 'string' ? searchParams.get('category') || undefined : undefined}
                            queryFilter={typeof searchParams.get('q') === 'string' ? searchParams.get('q') || undefined : undefined}
                            cityFilter={
                                (typeof searchParams.get('city') === 'string' ? searchParams.get('city') || undefined : undefined)
                                ?? (typeof searchParams.get('location') === 'string' ? searchParams.get('location') || undefined : undefined)
                            }
                            radiusFilter={typeof searchParams.get('radius') === 'string' ? searchParams.get('radius') || undefined : undefined}
                        />
                    </div>
                ) : null}

                {!isSearchPage && !isMinimal && !isOnboardingPage ? (
                    <nav className={cn(
                        "hidden lg:flex items-center shrink-0 gap-10"
                    )}>
                        {quickBeautyLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-xs uppercase tracking-widest font-semibold transition-colors duration-300 whitespace-nowrap text-white/70 hover:text-white"
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
                                className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-gray-400 transition-colors hover:text-white whitespace-nowrap"
                            >
                                {t('login')}
                            </Link>
                        </div>
                    ) : user ? (
                        <div className="hidden items-center gap-2 lg:flex">
                            {!isOnboardingPage ? (
                                <Link
                                    href="/chat"
                                    aria-label={t('openChat')}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </Link>
                            ) : null}
                            <AvatarDropdown user={user} />
                        </div>
                    ) : (
                        <div className="hidden items-center gap-6 lg:flex">
                            <Link
                                href="/auth/login"
                                className="text-xs uppercase tracking-widest font-semibold transition-all whitespace-nowrap text-gray-400 hover:text-white"
                            >
                                {t('login')}
                            </Link>
                            <Link
                                href="/become-pro"
                                className="px-6 py-2.5 rounded-md text-xs uppercase tracking-widest font-bold transition-all whitespace-nowrap bg-booking-primary text-white hover:brightness-110"
                            >
                                {t('becomePro')}
                            </Link>
                        </div>
                    )}

                    {!isMinimal && !isOnboardingPage ? (
                        <button
                            type="button"
                            aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white transition-colors hover:bg-white/10 lg:hidden"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    ) : null}
                </div>
            </div>

            {mobileMenuOpen && !isMinimal && (
                <div className="border-t border-white/10 bg-[#1A1514] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
                    <div className="mx-auto max-w-7xl space-y-2">
                        <Link
                            href="/search"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                        >
                            {t('search')}
                        </Link>
                        {!user && (
                            <Link
                                href="/become-pro"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                            >
                                {t('forMasters')}
                            </Link>
                        )}
                        {user && (
                            <Link
                                href="/chat"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                            >
                                <MessageCircle className="h-4 w-4 text-gray-500" />
                                {t('chat')}
                            </Link>
                        )}

                        <div className="my-2 h-px bg-white/10" />

                        {user ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                                        <AvatarFallback className="bg-white/10 text-xs font-semibold text-white">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-white">{user.name || t('userFallback')}</p>
                                        <p className="truncate text-xs text-gray-500">{user.email || t('noEmail')}</p>
                                    </div>
                                    <Badge variant="outline" className="border-white/20 bg-white/5 text-[10px] font-medium text-gray-400">
                                        {roleLabel}
                                    </Badge>
                                </div>

                                {hasIncompleteOnboarding && (
                                    <Link
                                        href={continueOnboardingHref}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md bg-white/5 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                                    >
                                        {t('continueOnboarding')}
                                    </Link>
                                )}
                                {user.role === 'ADMIN' && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                                    >
                                        {t('adminPanel')}
                                    </Link>
                                )}
                                {user.profileId && !hasIncompleteOnboarding && (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                                    >
                                        {t('masterCabinet')}
                                    </Link>
                                )}
                                {(!user.profileId || hasIncompleteOnboarding) && user.role !== 'ADMIN' && (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                                    >
                                        {t('myCabinet')}
                                    </Link>
                                )}
                                <Link
                                    href="/account/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                                >
                                    {t('accountSettings')}
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        signOut({ callbackUrl: '/' });
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    href="/auth/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex w-full items-center justify-center h-10 rounded-xl bg-white/10 border border-white/20 text-sm font-medium text-white transition-colors hover:bg-white/20"
                                >
                                    {t('forClient')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header >
    );
}
