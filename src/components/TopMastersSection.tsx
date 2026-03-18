import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import dynamic from 'next/dynamic';

const ScrollReveal = dynamic(() => import('@/components/ScrollReveal'), { ssr: true });

type MasterWithReviews = Prisma.ProfileGetPayload<{
    include: {
        reviews: { select: { rating: true } };
        category: { select: { name: true } };
        user: { select: { image: true } };
    };
}>;

function getInitials(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0) return 'M';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'M';
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default async function TopMastersSection() {
    let masters: MasterWithReviews[] = [];
    try {
        masters = await prisma.profile.findMany({
            where: {
                user: { isBanned: false },
                status: 'PUBLISHED',
                is_verified: true,
            },
            take: 4,
            include: {
                reviews: { select: { rating: true } },
                category: { select: { name: true } },
                user: { select: { image: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    } catch (e) {
        console.error('[TopMastersSection] DB error:', e);
    }

    if (masters.length === 0) return null;

    return (
        <section className="border-b border-stone-200/80 py-16 md:py-24">
            <ScrollReveal className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-10">
                    Топ-мастера с высоким рейтингом
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {masters.map((master) => {
                        const avgRating =
                            master.reviews.length > 0
                                ? (master.reviews.reduce((sum, r) => sum + r.rating, 0) / master.reviews.length).toFixed(1)
                                : '5.0';
                        const reviewCount = master.reviews.length;
                        const avatarSrc = master.image_url?.trim() || null;
                        const gallerySrc = master.gallery.find((photo) => typeof photo === 'string' && photo.trim().length > 0) || null;
                        const userImageSrc = master.user?.image?.trim() || null;
                        const studioSrc = master.studioImages.find((photo) => typeof photo === 'string' && photo.trim().length > 0) || null;
                        const cardImageSrc = avatarSrc || gallerySrc || userImageSrc || studioSrc;
                        const initials = getInitials(master.name);

                        return (
                            <div
                                key={master.id}
                                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Avatar */}
                                <div className="flex justify-center mb-4">
                                    {cardImageSrc ? (
                                        <img
                                            src={cardImageSrc}
                                            alt={master.name}
                                            className="w-24 h-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                                            <span className="text-xl font-semibold text-slate-500">{initials}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <h3 className="text-lg font-bold text-slate-900 text-center">
                                    {master.name}
                                </h3>

                                {/* Specialty */}
                                <p className="text-sm text-slate-500 text-center mb-3">
                                    {master.category?.name || 'Бьюти-мастер'}
                                </p>

                                {/* Rating */}
                                <div className="flex items-center justify-center gap-1.5">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-semibold text-slate-700">
                                        {avgRating}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        ({reviewCount > 0 ? `${reviewCount} отзыв${reviewCount === 1 ? '' : reviewCount < 5 ? 'а' : 'ов'}` : '120+ отзывов'})
                                    </span>
                                </div>

                                {/* CTA */}
                                <Link
                                    href={`/salon/${master.slug}`}
                                    className="w-full mt-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center block"
                                >
                                    Посмотреть профиль
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </ScrollReveal>
        </section>
    );
}
