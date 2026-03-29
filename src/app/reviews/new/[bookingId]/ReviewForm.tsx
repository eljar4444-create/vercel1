'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReview } from '@/app/actions/reviews';

export function ReviewForm({ bookingId, profileSlug }: { bookingId: number, profileSlug: string }) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) {
            setError('Пожалуйста, выберите оценку (от 1 до 5 звезд)');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('bookingId', bookingId.toString());
        formData.append('rating', rating.toString());
        formData.append('comment', comment);

        const result = await submitReview(formData);
        
        if (result.success) {
            router.push(`/salon/${profileSlug}?review=success`);
        } else {
            setError(result.error || 'Произошла ошибка');
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex flex-col items-center mb-6">
                <p className="font-medium text-gray-700 mb-2">Насколько вам понравилось?</p>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`text-4xl transition-colors ${(hover || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(rating)}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Отзыв (необязательно)</label>
                <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                    placeholder="Что вам больше всего понравилось?"
                />
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
                {loading ? 'Отправка...' : 'Опубликовать отзыв'}
            </button>
        </form>
    );
}
