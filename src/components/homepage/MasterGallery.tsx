import prisma from '@/lib/prisma';
import MasterCard from './MasterCard';

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

    const firstBatch = masters.slice(0, 3);
    const secondBatch = masters.slice(3, 6);

    return (
        <section className="py-24 px-8 bg-[#f0ebe4]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-xl">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-booking-primary mb-3 block">
                            Выбор SVOI
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain mb-6">
                            Топ мастеров в Берлине
                        </h2>
                        <p className="text-booking-textMuted text-lg leading-relaxed">
                            Мы проверяем каждого мастера на соответствие золотому стандарту качества SVOI.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center hover:bg-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center hover:bg-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-3 gap-8">
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
                </div>

                {/* JealousyCard - shown separately after masters */}
                {secondBatch.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-8 mt-8">
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
                )}
            </div>
        </section>
    );
}
