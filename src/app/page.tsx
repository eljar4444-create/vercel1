import { SearchHero } from '@/components/SearchHero';
import { ServiceCard } from '@/components/ServiceCard';
import { HomeCategories } from '@/components/HomeCategories';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const session = await auth();
    const services = await prisma.service.findMany({
        where: {
            status: 'APPROVED'
        },
        include: {
            providerProfile: {
                include: {
                    user: true
                }
            },
            city: true,
            category: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 6 // Limit for home page
    });

    const categories = await prisma.serviceCategory.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="bg-[#f5f5f7] min-h-screen pb-20">
            <SearchHero categories={categories} user={session?.user} />

            {/* Categories Section - Floating Cards */}
            <HomeCategories />

            {/* Approved Services Section */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Новые услуги</h2>
                            <p className="text-gray-500">Проверенные специалисты, готовые приступить к работе</p>
                        </div>
                        <Link href="/search" className="hidden md:flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Смотреть все <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>

                    {services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={{
                                        ...service,
                                        category: service.category.name,
                                        city: service.city?.name || '',
                                        provider: {
                                            name: service.providerProfile.user.name || '',
                                            email: service.providerProfile.user.email || '',
                                            image: service.providerProfile.user.image
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Пока нет услуг</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">Станьте первым исполнителем в этой категории или создайте заказ.</p>
                            <div className="flex justify-center gap-4">
                                <Button asChild className="bg-[#fc0] hover:bg-[#e6b800] text-black">
                                    <Link href="/create-order">Создать заказ</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/become-provider">Стать исполнителем</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center md:hidden">
                        <Link href="/search" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            Смотреть все услуги <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats/Trust Section (New) */}
            <section className="py-20 bg-white border-y border-gray-100 mt-10">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Безопасная сделка</h3>
                            <p className="text-gray-500 leading-relaxed">Деньги резервируются и переводятся исполнителю только после подтверждения выполнения.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                                <Star className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Проверенные отзывы</h3>
                            <p className="text-gray-500 leading-relaxed">Мы тщательно проверяем каждый отзыв, чтобы вы могли доверять рейтингу исполнителей.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Быстрый подбор</h3>
                            <p className="text-gray-500 leading-relaxed">80% заказов находят исполнителя в течение первых 30 минут после публикации.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works Section */}
            <section className="py-20 bg-[#f5f5f7]">
                <div className="container mx-auto px-4 max-w-5xl">
                    <h2 className="text-3xl font-bold mb-12 text-center text-black">Как это работает</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { num: '1', title: 'Опишите задачу', desc: 'Расскажите, что нужно сделать, и мы подберем специалистов.' },
                            { num: '2', title: 'Выберите исполнителя', desc: 'Изучите отзывы, рейтинги и цены, чтобы найти лучшего.' },
                            { num: '3', title: 'Закройте сделку', desc: 'Договоритесь о деталях и оплатите работу напрямую мастеру.' },
                        ].map((step, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-9xl leading-none text-gray-300 group-hover:text-orange-200 transition-colors select-none">
                                    {step.num}
                                </div>
                                <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xl mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 group-hover:bg-[#fc0] group-hover:text-black">
                                    {step.num}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-black relative z-10">{step.title}</h3>
                                <p className="text-gray-500 relative z-10 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
