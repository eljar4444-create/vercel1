'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { AvatarDropdown, getRoleLabel, getRoleMenuLinks } from '@/components/AvatarDropdown';
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

export function Header() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession(); // removed status
    const isAuthPage = pathname?.startsWith('/auth');
    const isSearchPage = pathname === '/search';
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const user = session?.user;
    const isProvider = user?.role === 'PROVIDER' || user?.role === 'ADMIN';
    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';
    const mobileRoleLinks = user
        ? getRoleMenuLinks({
            role: user.role,
            profileId: user.profileId,
        })
        : [];

    if (isAuthPage) return null;

    // REUSABLE AVATAR DROPDOWN
    // ... (Avatar render logic can stay, but need to check if AvatarDropdown uses legacy stuff)
    // Actually, AvatarDropdown is imported, let's keep using it if it's safe.

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-[#F5F2EB]/95 backdrop-blur-sm transition-all duration-200",
            scrolled && "shadow-sm"
        )}>
            <div className="container mx-auto flex h-16 w-full items-center gap-4 px-4 max-w-7xl">
                {/* Left Area (Logo) */}
                <div className="flex flex-1 items-center justify-start">
                    <Link href="/" className="flex items-center shrink-0 relative z-10">
                        <img src="/logo.png?v=6" alt="Svoi.de" className="h-9 w-auto object-contain" />
                    </Link>
                </div>

                {isSearchPage ? (
                    <div className="hidden lg:block flex-1 min-w-0">
                        <SearchFiltersForm
                            categoryFilter={typeof searchParams.get('category') === 'string' ? searchParams.get('category') || undefined : undefined}
                            queryFilter={typeof searchParams.get('q') === 'string' ? searchParams.get('q') || undefined : undefined}
                            cityFilter={typeof searchParams.get('city') === 'string' ? searchParams.get('city') || undefined : undefined}
                        />
                    </div>
                ) : null}

                {!isSearchPage ? (
                    <nav className="hidden lg:flex flex-1 items-center justify-center shrink-0 gap-6 lg:gap-8">
                        {QUICK_BEAUTY_LINKS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 whitespace-nowrap"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                ) : null}

                {/* Right Actions */}
                <div className={cn("flex flex-1 items-center justify-end gap-2", isSearchPage && "lg:flex-none")}>
                    {user ? (
                        <div className="hidden items-center gap-2 lg:flex">
                            <Link
                                href="/chat"
                                aria-label="Открыть чат"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:text-gray-900 hover:shadow-md"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </Link>
                            <AvatarDropdown user={user} />
                        </div>
                    ) : (
                        <div className="hidden items-center gap-3 lg:flex">
                            <Link
                                href="/become-pro"
                                className="hidden xl:inline-block text-sm font-semibold text-slate-900 transition-opacity hover:opacity-80 whitespace-nowrap"
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

                    <button
                        type="button"
                        aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 lg:hidden"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
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
                                        {getRoleLabel(user.role)}
                                    </Badge>
                                </div>

                                {mobileRoleLinks.map((link) => (
                                    <Link
                                        key={`mobile-${link.href}-${link.label}`}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        {link.label}
                                    </Link>
                                ))}

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
