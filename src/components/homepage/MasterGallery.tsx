import prisma from '@/lib/prisma';
import MasterCard from './MasterCard';
import JealousyCard from './JealousyCard';

export default async function MasterGallery() {
    let masters;
    try {
        masters = await prisma.profile.findMany({
            where: {
                user: { isBanned: false },
                status: 'PUBLISHED',
                is_verified: true,
            },
            take: 9,
            include: {
                reviews: { select: { rating: true } },
                category: { select: { name: true } },
                user: { select: { image: true } },
                services: { select: { title: true, price: true, duration_min: true }, take: 2 },
            },
            orderBy: { created_at: 'desc' },
        });
    } catch (e) {
        console.error('[MasterGallery] DB error:', e);
        return null;
    }

    if (masters.length === 0) return null;

    const firstBatch = masters.slice(0, 6);
    const secondBatch = masters.slice(6);

    return (
        <section className="py-12 md:py-16 bg-booking-bg">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <h2 className="font-didot text-2xl md:text-4xl font-bold tracking-wide text-booking-textMain mb-8">
                    Наши мастера
                </h2>

                <div className="flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
                    {firstBatch.map((master) => {
                        const avgRating =
                            master.reviews.length > 0
                                ? (master.reviews.reduce((sum, r) => sum + r.rating, 0) / master.reviews.length).toFixed(1)
                                : '5.0';

                        const workPhotoUrl =
                            master.gallery.find((p) => typeof p === 'string' && p.trim().length > 0) ||
                            master.image_url?.trim() ||
                            master.user?.image?.trim() ||
                            null;

                        return (
                            <MasterCard
                                key={master.id}
                                slug={master.slug}
                                name={master.name}
                                category={master.category?.name || 'Бьюти-мастер'}
                                city={master.city}
                                isVerified={master.is_verified}
                                avgRating={avgRating}
                                workPhotoUrl={workPhotoUrl}
                                services={master.services.map((s) => ({
                                    title: s.title,
                                    price: Number(s.price),
                                    durationMin: s.duration_min,
                                }))}
                            />
                        );
                    })}

                    <JealousyCard />

                    {secondBatch.map((master) => {
                        const avgRating =
                            master.reviews.length > 0
                                ? (master.reviews.reduce((sum, r) => sum + r.rating, 0) / master.reviews.length).toFixed(1)
                                : '5.0';

                        const workPhotoUrl =
                            master.gallery.find((p) => typeof p === 'string' && p.trim().length > 0) ||
                            master.image_url?.trim() ||
                            master.user?.image?.trim() ||
                            null;

                        return (
                            <MasterCard
                                key={master.id}
                                slug={master.slug}
                                name={master.name}
                                category={master.category?.name || 'Бьюти-мастер'}
                                city={master.city}
                                isVerified={master.is_verified}
                                avgRating={avgRating}
                                workPhotoUrl={workPhotoUrl}
                                services={master.services.map((s) => ({
                                    title: s.title,
                                    price: Number(s.price),
                                    durationMin: s.duration_min,
                                }))}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
