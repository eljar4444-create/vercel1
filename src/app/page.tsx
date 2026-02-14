import prisma from '@/lib/prisma';
import { SearchHero } from '@/components/SearchHero';
import { HomeCategories } from '@/components/HomeCategories';
import { ServiceCard } from '@/components/ServiceCard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const session = await auth();

    // Fetch Categories for SearchHero
    const categoriesData = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    // Map Prisma categories to SearchHero format
    const heroCategories = categoriesData.map(c => ({
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
            <HomeCategories />

            {/* Recent Services Feed */}
            {services.length > 0 && (
                <div className="container mx-auto px-4 py-12">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Новые задания</h2>
                            <p className="text-gray-500 mt-2">Последние опубликованные услуги и заявки</p>
                        </div>
                        {/* <Link href="/search" className="text-blue-600 font-medium hover:underline">Смотреть все</Link> */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map(service => (
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

            {/* SEO / Info Section (Restoring generic content if needed) */}
            <div className="container mx-auto px-4 py-16 border-t border-gray-200 mt-12">
                <div className="grid md:grid-cols-3 gap-12 text-center">
                    <div>
                        <div className="w-16 h-16 bg-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Проверенные специалисты</h3>
                        <p className="text-gray-500 leading-relaxed">Все исполнители проходят проверку документов и телефона.</p>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-purple-100/50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Быстрый поиск</h3>
                        <p className="text-gray-500 leading-relaxed">Создайте задание, и исполнители сами предложат свои услуги.</p>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Безопасная сделка</h3>
                        <p className="text-gray-500 leading-relaxed">Оплата резервируется и переводится исполнителю только после выполнения работы.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
