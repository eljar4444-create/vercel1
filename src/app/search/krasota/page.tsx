import { Button } from '@/components/ui/button';
import { Search, LayoutGrid, CheckCircle2, MoreVertical, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export default async function BeautySearchPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    // 1. Fetch "Beauty" category
    const category = await prisma.serviceCategory.findUnique({
        where: { slug: 'beauty' }
    });

    // 2. Determine search filter (if user clicked "Manicure" chip)
    // We treat "q" or "subcategory" as a filter for title
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;

    // 3. Fetch services
    const services = await prisma.service.findMany({
        where: {
            categoryId: category?.id,
            status: 'APPROVED',
            // Simple subcategory filter via title match
            ...(query ? {
                title: {
                    contains: query
                }
            } : {})
        },
        include: {
            providerProfile: {
                include: {
                    user: true
                }
            },
            city: true
        }
    });

    const tags = ['Наращивание ресниц', 'Макияж', 'Маникюр', 'Косметолог', 'Массаж', 'Парикмахер'];

    return (
        <div className="container mx-auto px-4 max-w-7xl flex items-start gap-8 font-sans text-slate-900">
            {/* Sidebar (Left) */}
            {/* Sidebar (Left) */}
            <aside className="w-64 hidden lg:flex flex-col py-8 shrink-0">

                <nav className="space-y-6 text-gray-500 font-medium text-[15px]">
                    <Link href="/search" className="flex items-center gap-3 hover:text-black transition-colors">
                        <LayoutGrid className="w-5 h-5" />
                        Найти специалиста
                    </Link>
                    <Link href="/my-orders" className="flex items-center gap-3 hover:text-black transition-colors">
                        <CheckCircle2 className="w-5 h-5" />
                        Мои заказы
                    </Link>
                    <Link href="/become-provider" className="flex items-center gap-3 hover:text-black transition-colors">
                        <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-[10px] font-bold">🛠</div>
                        Стать исполнителем
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 py-8">

                <div className="max-w-[1400px] mx-auto px-12 py-8 flex gap-12 items-start">

                    {/* Middle Column: Results */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-6 flex justify-between items-center">
                            <h1 className="text-blue-600 font-bold text-lg">Красота {query ? `/ ${query}` : ''}</h1>
                            <span className="text-gray-400 text-sm">{services.length} исполнителей</span>
                        </div>

                        {/* Search Chips / Categories */}
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <Link key={i} href={`/search/krasota?q=${tag}`}>
                                        <span className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${query === tag ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                            {tag}
                                        </span>
                                    </Link>
                                ))}
                                {query && (
                                    <Link href="/search/krasota">
                                        <span className="px-4 py-2 bg-red-50 text-red-500 rounded-full text-sm cursor-pointer hover:bg-red-100">
                                            Сбросить
                                        </span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Dynamic Services List */}
                        <div className="space-y-6">
                            {services.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                                    <div className="text-gray-400 mb-2">Ничего не найдено</div>
                                    <p className="text-sm text-gray-500">Попробуйте изменить категорию или вернуться позже</p>
                                </div>
                            ) : (
                                services.map(service => (
                                    <div key={service.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex gap-6">
                                            {/* Avatar Column */}
                                            <div className="space-y-3 shrink-0">
                                                <div className="w-32 h-32 rounded-2xl overflow-hidden relative bg-gray-100">
                                                    <Avatar className="w-full h-full rounded-none">
                                                        <AvatarImage src={service.providerProfile.user.image || "/placeholder-avatar.jpg"} className="object-cover" />
                                                        <AvatarFallback className="bg-orange-100 text-orange-600 text-4xl font-bold rounded-none">
                                                            {service.providerProfile.user.name?.[0] || 'И'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
                                                    <span>Паспорт<br />проверен</span>
                                                </div>
                                            </div>

                                            {/* Info Column */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <Link href={`/profile/${service.providerProfile.userId}`} className="text-xl font-bold hover:text-red-500 text-blue-600">
                                                        {service.providerProfile.user.name}
                                                    </Link>
                                                    <button className="text-gray-300 hover:text-gray-500"><MoreVertical className="w-5 h-5" /></button>
                                                </div>
                                                <div className="text-sm text-gray-500 mb-4">{service.city?.name || 'Город не указан'}</div>

                                                <div className="space-y-2 mb-6">
                                                    <div className="flex justify-between text-[15px]">
                                                        <span className="font-medium text-blue-600 hover:text-red-500 cursor-pointer">{service.title}</span>
                                                        <span className="font-bold">{service.price} €</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button className="bg-gray-100 hover:bg-gray-200 text-black rounded-xl px-6 h-10 font-medium shadow-none">
                                                        <Phone className="w-4 h-4 mr-2" /> Телефон
                                                    </Button>
                                                    <Button className="bg-gray-100 hover:bg-gray-200 text-black rounded-xl px-6 h-10 font-medium shadow-none">
                                                        <MessageCircle className="w-4 h-4 mr-2" /> Чат
                                                    </Button>
                                                    <Button className="bg-gray-100 hover:bg-gray-200 text-black rounded-xl px-6 h-10 font-medium shadow-none">
                                                        Предложить заказ
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>

                    {/* Right Sidebar: Filters */}
                    <div className="w-80 space-y-8 shrink-0">
                        {/* Filters */}
                        <div>
                            <h3 className="font-bold mb-3 text-gray-900">Тип исполнителя</h3>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center cursor-pointer">
                                </div>
                                <span className="text-sm">Частное лицо</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2 text-gray-900">Место</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    defaultValue="Байройт"
                                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#fc0]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
