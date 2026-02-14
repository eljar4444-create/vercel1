import prisma from '@/lib/prisma';
import { ServiceCard, ServiceItem } from '@/components/ServiceCard';
import { SearchHero } from '@/components/SearchHero';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const session = await auth();
    const categorySlug = searchParams.category as string;
    const query = searchParams.q as string;

    // Build filter
    const where: any = {};

    if (categorySlug) {
        where.category = {
            slug: categorySlug
        };
    }

    if (query) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
        ];
    }

    const services = await prisma.directoryService.findMany({
        where,
        include: {
            profile: {
                include: { category: true }
            }
        },
        orderBy: { id: 'desc' }
    });

    const categoriesData = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    const heroCategories = categoriesData.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        slug: c.slug,
        image: null
    }));

    return (
        <div className="bg-[#f5f5f7] min-h-screen pb-20">
            <SearchHero categories={heroCategories} user={session?.user} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">
                    {categorySlug
                        ? `Услуги в категории "${categoriesData.find((c: any) => c.slug === categorySlug)?.name || categorySlug}"`
                        : query ? `Результаты поиска: "${query}"` : "Все услуги"}
                </h1>

                {services.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-500">Ничего не найдено.</p>
                        <p className="text-gray-400 mt-2">Попробуйте изменить параметры поиска.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service: any) => (
                            <ServiceCard key={service.id} service={{
                                ...service,
                                id: service.id,
                                title: service.title,
                                price: service.price.toString(),
                                description: null,
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
                )}
            </div>
        </div>
    );
}
