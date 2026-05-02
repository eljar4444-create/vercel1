'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ReviewRow {
    id: string;
    rating: number;
    comment: string | null;
    replyText: string | null;
    repliedAt: string | null;
    createdAt: string;
    clientName: string;
    clientImage: string | null;
    serviceTitle: string | null;
    bookingDate: string | null;
}

interface ReviewsSectionProps {
    profileId: number;
}

function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
    const dim = size === 'lg' ? 'h-6 w-6' : 'h-3.5 w-3.5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`${dim} ${
                        i <= Math.round(value)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                    }`}
                />
            ))}
        </div>
    );
}

export function ReviewsSection(_: ReviewsSectionProps) {
    const t = useTranslations('dashboard.provider.reviews');
    const locale = useLocale();
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyDraft, setReplyDraft] = useState('');
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard/reviews');
            if (!res.ok) {
                setError(t('loadError'));
                return;
            }
            const data = await res.json();
            setReviews(data.reviews ?? []);
            setAverage(data.average ?? 0);
            setCount(data.count ?? 0);
        } catch {
            setError(t('networkError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openReply = (r: ReviewRow) => {
        setReplyingId(r.id);
        setReplyDraft(r.replyText ?? '');
    };

    const cancelReply = () => {
        setReplyingId(null);
        setReplyDraft('');
    };

    const submitReply = async (reviewId: string) => {
        if (!replyDraft.trim()) return;
        setSubmittingId(reviewId);
        try {
            const res = await fetch(`/api/dashboard/reviews/${reviewId}/reply`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replyText: replyDraft.trim() }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.error ?? t('replySaveError'));
                return;
            }
            await load();
            cancelReply();
        } catch {
            setError(t('networkError'));
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="bg-transparent">
            <div className="border-b border-gray-300 pb-10 mb-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {t('eyebrow')}
                </p>
                {count > 0 ? (
                    <div className="mt-3 flex items-end gap-6">
                        <div className="flex items-baseline gap-3">
                            <span className="text-6xl font-light tracking-tight text-gray-900 tabular-nums">
                                {average.toFixed(1)}
                            </span>
                            <Stars value={average} size="lg" />
                        </div>
                        <p className="pb-1 text-sm text-stone-400">
                            {t('count', { count })}
                        </p>
                    </div>
                ) : (
                    <h2 className="mt-3 text-2xl font-light text-gray-900">
                        {t('emptyTitle')}
                    </h2>
                )}
            </div>

            {error && (
                <div className="border-l-2 border-red-500 bg-red-50/40 px-3 py-2 mb-6 text-xs text-red-700">
                    {error}
                </div>
            )}

            {isLoading && reviews.length === 0 ? (
                <div className="py-16 flex items-center justify-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="border border-dashed border-gray-300 py-14 text-center">
                    <MessageSquare className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <p className="text-sm text-stone-400 max-w-sm mx-auto">
                        {t('emptyBody')}
                    </p>
                </div>
            ) : (
                <div>
                    {reviews.map((r) => (
                        <div
                            key={r.id}
                            className="flex flex-col py-8 border-b border-gray-200/60 last:border-0"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">
                                        {r.clientName}
                                    </span>
                                    <Stars value={r.rating} />
                                </div>
                                <div className="text-sm text-gray-400 tabular-nums">
                                    {new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(r.createdAt))}
                                </div>
                            </div>

                            {r.serviceTitle && (
                                <p className="mt-2 text-xs uppercase tracking-wider text-gray-400">
                                    {r.serviceTitle}
                                </p>
                            )}

                            {r.comment && (
                                <p className="text-gray-800 leading-relaxed mt-3 max-w-2xl">
                                    {r.comment}
                                </p>
                            )}

                            {r.replyText && replyingId !== r.id && (
                                <div className="mt-5 ml-6 pl-5 border-l-2 border-gray-300">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                                        {t('yourReply')}
                                    </p>
                                    <p className="mt-2 text-gray-600 italic leading-relaxed max-w-2xl">
                                        {r.replyText}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => openReply(r)}
                                        className="mt-2 text-xs font-medium text-gray-500 underline underline-offset-4 hover:text-gray-800"
                                    >
                                        {t('edit')}
                                    </button>
                                </div>
                            )}

                            {!r.replyText && replyingId !== r.id && (
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => openReply(r)}
                                        className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-gray-900"
                                    >
                                        {t('reply')}
                                    </button>
                                </div>
                            )}

                            {replyingId === r.id && (
                                <div className="mt-5 ml-6 pl-5 border-l-2 border-gray-300 max-w-2xl">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                                        {t('yourReply')}
                                    </p>
                                    <textarea
                                        value={replyDraft}
                                        onChange={(e) => setReplyDraft(e.target.value)}
                                        rows={3}
                                        placeholder={t('replyPlaceholder')}
                                        className="mt-2 w-full bg-transparent border-b border-gray-300 focus:border-gray-900 rounded-none px-0 py-2 text-gray-800 leading-relaxed outline-none resize-none placeholder:text-gray-400 transition-colors"
                                        autoFocus
                                    />
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={cancelReply}
                                            disabled={submittingId === r.id}
                                            className="text-sm font-medium text-gray-500 underline underline-offset-4 hover:text-gray-800 disabled:opacity-50"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => submitReply(r.id)}
                                            disabled={
                                                submittingId === r.id ||
                                                !replyDraft.trim()
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {submittingId === r.id && (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            )}
                                            {t('publish')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
