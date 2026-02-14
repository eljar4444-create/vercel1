import prisma from '@/lib/prisma';
import { SearchHero } from '@/components/SearchHero';
import { HomeCategories } from '@/components/HomeCategories';
import { ServiceCard } from '@/components/ServiceCard';
import { auth } from '@/auth';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const session = await auth();

    // Fetch Categories for SearchHero
    const categoriesData = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    // Map Prisma categories to SearchHero format
    const heroCategories = categoriesData.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        slug: c.slug,
        image: null
    }));

    // Fetch Recent Services
    const services = await prisma.directoryService.findMany({
        take: 8,
        orderBy: { id: 'desc' },
        include: {
            profile: {
                include: {
                    category: true
                }
            }
        }
    });

    return (
        <div className="bg-[#f5f5f7] min-h-screen pb-20">
            {/* Main Search Hero with Background */}
            <SearchHero categories={heroCategories} user={session?.user} />

            {/* Categories Grid (Static/Icon based) */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* We use categoriesData because we want icons */}
                    {categoriesData.map((cat: any) => {
                        // Dynamically render icon, fallback to Circle
                        const Icon = (Icons as any)[cat.icon || 'Circle'] || Icons.Circle;
                        return (
                            <Link key={cat.id} href={`/search?category=${cat.slug}`} className="group">
                                <Card className="p-8 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 h-full border-transparent hover:border-blue-100 group-hover:-translate-y-1">
                                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="font-semibold text-lg text-gray-800">{cat.name}</div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Recent Services Feed */}
            {services.length > 0 && (
                <div className="container mx-auto px-4 py-12">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Новые задания</h2>
                            <p className="text-gray-500 mt-2">Последние опубликованные услуги и заявки</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service: any) => (
                            <ServiceCard key={service.id} service={{
                                ...service,
                                id: service.id,
                                title: service.title,
                                price: service.price.toString(),
                                description: null, // DirectoryService has no description
                                // Use profile creation date as fallback or just null
                                createdAt: service.profile.created_at,
                                profile: {
                                    name: service.profile.name,
                                    city: service.profile.city,
                                    image_url: service.profile.image_url,
                                    email: service.profile.user_email
                                },
                                category: service.profile.category
                            }} />
                        ))}
                    </div>
                </div>
            )}

            {/* SEO / Info Section */}
            <div className="container mx-auto px-4 py-16 border-t border-gray-200 mt-12">
                <div className="grid md:grid-cols-3 gap-12 text-center">
                    <div>
                        <div className="w-16 h-16 bg-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                            <Icons.ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Проверенные специалисты</h3>
                        <p className="text-gray-500 leading-relaxed">Все исполнители проходят проверку документов и телефона.</p>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-purple-100/50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-6">
                            <Icons.Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Быстрый поиск</h3>
                        <p className="text-gray-500 leading-relaxed">Создайте задание, и исполнители сами предложат свои услуги.</p>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-6">
                            <Icons.Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Безопасная сделка</h3>
                        <p className="text-gray-500 leading-relaxed">Оплата резервируется и переводится исполнителю только после выполнения работы.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
