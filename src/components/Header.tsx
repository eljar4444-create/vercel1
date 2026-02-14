'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AvatarDropdown } from '@/components/AvatarDropdown';

export function Header() {
    const pathname = usePathname();
    const { data: session } = useSession(); // removed status
    const isAuthPage = pathname?.startsWith('/auth');
    // const isProviderPage = pathname?.startsWith('/provider'); // Provider pages deleted
    const [scrolled, setScrolled] = useState(false);
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);
    // const [unreadCount, setUnreadCount] = useState(0);

    // Chat unread count logic removed

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const user = session?.user;

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
                    {/* Legacy links removed */}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4 ml-4">
                    {user ? (
                        <div className="flex items-center gap-5 text-gray-400">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-[10px] font-bold text-blue-600">{user.role}</span>
                                <span className="text-[10px] text-gray-400 max-w-[100px] truncate">{user.email}</span>
                            </div>
                            <AvatarDropdown user={user} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" asChild className="hover:bg-gray-100 text-black font-medium">
                                <Link href="/auth/login">Войти</Link>
                            </Button>
                            <Button asChild className="bg-[#fc0] hover:bg-[#e6b800] text-black font-medium shadow-none rounded-md px-5 py-2 h-9">
                                <Link href="/auth/register">Регистрация</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header >
    );
}
