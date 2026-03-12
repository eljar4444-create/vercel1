import Link from 'next/link';
import Image from 'next/image';
import { Star, User } from 'lucide-react';
import prisma from '@/lib/prisma';
import dynamic from 'next/dynamic';

const ScrollReveal = dynamic(() => import('@/components/ScrollReveal'), { ssr: true });

export default async function TopMastersSection() {
    const masters = await prisma.profile.findMany({
        where: {
            user: { isBanned: false },
            is_verified: true,
        },
        take: 4,
        include: {
            reviews: { select: { rating: true } },
            category: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
    });

    if (masters.length === 0) return null;

    return (
        <section className="bg-[#F8F9FA] py-16 md:py-24">
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

                        return (
                            <div
                                key={master.id}
                                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Avatar */}
                                <div className="flex justify-center mb-4">
                                    {master.image_url ? (
                                        <Image
                                            src={master.image_url}
                                            alt={master.name}
                                            width={96}
                                            height={96}
                                            className="w-24 h-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-10 h-10 text-slate-400" />
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

