'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { AvatarDropdown, getRoleLabel, getRoleMenuLinks } from '@/components/AvatarDropdown';
import { Menu, X, MessageCircle, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function Header() {
    const pathname = usePathname();
    const { data: session } = useSession(); // removed status
    const isAuthPage = pathname?.startsWith('/auth');
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const user = session?.user;
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
            "fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 min-h-[6rem] flex flex-col justify-center transition-all duration-200",
            scrolled && "shadow-sm"
        )}>
            <div className="container mx-auto px-4 flex justify-between items-center h-24 max-w-7xl w-full">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <img src="/logo.png?v=6" alt="Svoi.de" className="h-20 w-auto object-contain" />
                </Link>

                {/* Navigation */}
                <nav className="hidden xl:flex items-center gap-6 font-medium text-[14px] whitespace-nowrap">
                    <Link href="/search" className="hover:text-blue-600 transition-colors">
                        Services
                    </Link>
                    <Link href="/auth/register?role=provider" className="hover:text-blue-600 transition-colors">
                        Become a Pro
                    </Link>
                    <Link href="/chat" className="hover:text-blue-600 transition-colors">
                        Chat
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="ml-4 flex items-center gap-2">
                    {user ? (
                        <div className="hidden items-center xl:flex">
                            <AvatarDropdown user={user} />
                        </div>
                    ) : (
                        <div className="hidden items-center gap-3 xl:flex">
                            <Button variant="ghost" asChild className="h-9 rounded-md px-4 text-black hover:bg-gray-100">
                                <Link href="/auth/login">Войти</Link>
                            </Button>
                            <Button asChild className="h-9 rounded-md bg-[#fc0] px-5 text-black shadow-none hover:bg-[#e6b800]">
                                <Link href="/auth/register">Регистрация</Link>
                            </Button>
                        </div>
                    )}

                    <button
                        type="button"
                        aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 xl:hidden"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 shadow-sm xl:hidden">
                    <div className="mx-auto max-w-7xl space-y-2">
                        <Link
                            href="/search"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Services
                        </Link>
                        <Link
                            href="/auth/register?role=provider"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Become a Pro
                        </Link>
                        <Link
                            href="/chat"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <MessageCircle className="h-4 w-4 text-gray-400" />
                            Chat
                        </Link>

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
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" asChild className="h-9">
                                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                                        Войти
                                    </Link>
                                </Button>
                                <Button asChild className="h-9 bg-[#fc0] text-black hover:bg-[#e6b800]">
                                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                                        Регистрация
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header >
    );
}
