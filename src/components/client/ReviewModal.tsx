'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { createReview } from '@/actions/reviews';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: number;
    masterName: string;
}

export function ReviewModal({ isOpen, onClose, bookingId, masterName }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Пожалуйста, выберите оценку');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createReview(bookingId, rating, comment);
            if (result.success) {
                toast.success('Отзыв успешно отправлен!');
                onClose();
            } else {
                toast.error(result.error || 'Произошла ошибка');
            }
        } catch (error) {
            toast.error('Произошла непредвиденная ошибка');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />
            <div
                className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Оцените визит к {masterName}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Закрыть"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5 flex flex-col items-center gap-6">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-200 hover:text-amber-200'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="w-full space-y-3">
                        <label htmlFor="comment" className="text-sm font-medium text-slate-700">
                            Расскажите о ваших впечатлениях (необязательно)
                        </label>
                        <Textarea
                            id="comment"
                            placeholder="Что вам особенно понравилось?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none h-24"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 w-full border-t border-slate-100 px-5 py-4">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                        {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
