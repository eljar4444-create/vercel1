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

            {/* Categories Section Removed */}
            <div className="pt-8" />

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
                                    variant="vertical"
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


        </div>
    );
}
