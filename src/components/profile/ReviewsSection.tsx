'use client';

import { Star } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export interface ReviewProps {
    id: string;
    comment: string | null;
    rating: number;
    createdAt: string;
    clientName: string;
}

export function ReviewsSection({ reviews }: { reviews: ReviewProps[] }) {
    const t = useTranslations('salon');
    return (
        <section className="rounded-3xl bg-booking-card p-6 shadow-soft-out">
            <h2 className="text-xl font-serif font-semibold text-booking-textMain">
                {t('section.reviews')}
            </h2>

            {reviews && reviews.length > 0 ? (
                <div className="mt-5 divide-y divide-booking-border/50">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-booking-bg py-12 text-center">
                    <Star className="h-8 w-8 text-booking-textMuted/40" />
                    <p className="text-sm text-booking-textMuted">
                        {t('section.reviewsEmpty')}
                    </p>
                </div>
            )}
        </section>
    );
}

function ReviewCard({ review }: { review: ReviewProps }) {
    const t = useTranslations('salon');
    const locale = useLocale();
    const initials =
        review.clientName
            ?.split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';

    const date = new Date(review.createdAt).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="py-5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-booking-bg text-xs font-semibold text-booking-textMuted">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-booking-textMain truncate">
                            {review.clientName || t('fallback.clientNameAlt')}
                        </span>
                        <span className="text-xs text-booking-textMuted shrink-0">{date}</span>
                    </div>
                    <div className="mt-1 flex gap-0.5" aria-label={t('rating.aria', { rating: review.rating })}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-3 w-3 ${
                                    star <= review.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'fill-booking-border text-booking-border'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            {review.comment && (
                <p className="ml-12 mt-2 text-sm text-booking-textMuted whitespace-pre-wrap leading-relaxed">
                    {review.comment}
                </p>
            )}
        </div>
    );
}
