'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AvatarDropdown } from '@/components/AvatarDropdown';

export function Header() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const isAuthPage = pathname?.startsWith('/auth');
    const isProviderPage = pathname?.startsWith('/provider');
    const [scrolled, setScrolled] = useState(false);
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (status !== 'authenticated') return;
            try {
                const res = await axios.get('/api/chat/unread');
                if (res.data && typeof res.data.count === 'number') {
                    setUnreadCount(res.data.count);
                }
            } catch (error) {
                console.error('Failed to fetch unread count', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const user = session?.user;
    // console.log('Current User in Header:', user);

    // if (status === 'loading') return null;
    if (isAuthPage) return null;

    // REUSABLE AVATAR DROPDOWN
    const renderAvatar = () => (
        <div
            className="relative"
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
        >
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center border border-pink-100 cursor-pointer overflow-hidden">
                {user?.image ? (
                    <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-lg">🐱</span>
                )}
            </div>

            {/* Dropdown Menu */}
            {isAvatarHovered && (
                <div className="absolute right-0 top-full pt-2 w-[300px] z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 text-sm overflow-hidden relative">
                        {/* Triangle Pointer */}
                        <div className="absolute -top-1.5 right-3 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-100"></div>

                        {/* Profile Info */}
                        <div className="p-4 flex items-start gap-3 relative bg-white z-10">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border border-pink-100 shrink-0 overflow-hidden">
                                {user?.image ? (
                                    <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl">🐱</span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="font-bold text-gray-900 truncate">{user?.name || 'Марина'}</div>
                                <div className="text-gray-500 text-xs truncate">{user?.email || 'marina@example.com'}</div>
                                <Link href="/account" className="text-blue-600 text-xs mt-1 block hover:underline">
                                    Управление аккаунтом
                                </Link>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 mx-4" />

                        {/* Links */}
                        <div className="py-2 flex flex-col">
                            <Link href="#" className="px-5 py-2 hover:bg-gray-50 text-gray-700 transition-colors">Почта</Link>
                            <Link href="#" className="px-5 py-2 hover:bg-gray-50 text-gray-700 transition-colors">Написать письмо</Link>
                            <Link href="#" className="px-5 py-2 hover:bg-gray-50 text-gray-700 transition-colors">Мой диск</Link>
                        </div>

                        <div className="h-px bg-gray-100 mx-4" />

                        {/* Add Account */}
                        <div className="p-4">
                            <button className="flex items-center gap-3 w-full text-left hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                </div>
                                <span className="text-gray-700 font-medium">Добавить аккаунт</span>
                            </button>

                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="w-full text-left px-2 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mt-1"
                            >
                                Выйти
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="bg-[#f5f5f7] px-5 py-3 flex justify-between text-xs text-gray-500">
                            <Link href="#" className="hover:text-gray-800">Настройки</Link>
                            <Link href="#" className="hover:text-gray-800">Справка</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // PROVIDER HEADER (Cabinet)
    if (isProviderPage) {
        return (
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-24 flex items-center">
                <div className="container mx-auto px-4 flex justify-between items-center h-full max-w-7xl">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Svoi.de" className="h-20 w-auto object-contain" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-[15px] text-gray-500">
                        <Link href="/my-orders" className="hover:text-black transition-colors">Ваши заказы</Link>
                        <Link href="/orders" className="hover:text-black transition-colors">Поиск заказов</Link>
                        <Link href="/provider/profile" className="text-black font-medium">Мой профиль</Link>
                        <Link href="#" className="hover:text-black transition-colors">Продвижение</Link>
                        <Link href="#" className="hover:text-black transition-colors">Подписки</Link>
                        <Link href="#" className="hover:text-black transition-colors">Настройки</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-5 text-gray-400">
                            <Link href="/chat" className="relative">
                                <Button variant="ghost" size="icon" className="hover:text-gray-600 hover:bg-transparent">
                                    <span className="sr-only">Сообщения</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send rotate-[-45deg] mt-1"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                    )}
                                </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="hover:text-gray-600 hover:bg-transparent relative">
                                <span className="sr-only">Уведомления</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-gray-400"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            </Button>

                            <AvatarDropdown user={user} />
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    // PUBLIC / CLIENT HEADER
    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-24 flex items-center transition-all duration-200",
            scrolled && "shadow-sm"
        )}>
            <div className="container mx-auto px-4 flex justify-between items-center h-full max-w-7xl">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <img src="/logo.png?v=6" alt="Svoi.de" className="h-20 w-auto object-contain" />
                </Link>



                {/* Navigation */}
                {/* Navigation */}
                <nav className="hidden xl:flex items-center gap-6 font-medium text-[14px] whitespace-nowrap">
                    <Link
                        href="/create-order"
                        className={cn("transition-colors", pathname === '/create-order' ? "text-blue-600 font-bold" : "text-gray-500 hover:text-black")}
                    >
                        Создать заказ
                    </Link>
                    <Link
                        href="/search"
                        className={cn("transition-colors", pathname?.startsWith('/search') || pathname?.startsWith('/profile/') ? "text-blue-600 font-bold" : "text-gray-500 hover:text-black")}
                    >
                        Найти специалиста
                    </Link>
                    <Link
                        href="/my-orders"
                        className={cn("transition-colors", pathname === '/my-orders' ? "text-blue-600 font-bold" : "text-gray-500 hover:text-black")}
                    >
                        Мои заказы
                    </Link>
                    {user?.role === 'PROVIDER' ? (
                        <Link
                            href="/provider/profile"
                            className={cn("transition-colors", pathname?.startsWith('/provider') ? "text-blue-600 font-bold" : "text-gray-500 hover:text-black")}
                        >
                            Кабинет исполнителя
                        </Link>
                    ) : (
                        <Link
                            href="/auth/register?role=provider"
                            className={cn("transition-colors", pathname === '/auth/register' ? "text-blue-600 font-bold" : "text-gray-500 hover:text-black")}
                        >
                            Стать исполнителем
                        </Link>
                    )}
                    {user?.role === 'ADMIN' && (
                        <>
                            <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold transition-colors">
                                Пользователи
                            </Link>
                            <Link href="/admin/moderation" className="text-red-600 hover:text-red-700 bg-red-50 px-3 py-1 rounded-full text-xs font-bold transition-colors">
                                Модерация услуг
                            </Link>
                            <Link href="/admin/orders" className="text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1 rounded-full text-xs font-bold transition-colors">
                                Модерация заказов
                            </Link>
                        </>
                    )}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4 ml-4">
                    {user ? (
                        <div className="flex items-center gap-5 text-gray-400">
                            <Link href="/chat" className="relative">
                                <Button variant="ghost" size="icon" className="hover:text-gray-600 hover:bg-transparent">
                                    <span className="sr-only">Сообщения</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send rotate-[-45deg] mt-1"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                    )}
                                </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="hover:text-gray-600 hover:bg-transparent relative">
                                <span className="sr-only">Уведомления</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-gray-400"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            </Button>

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
