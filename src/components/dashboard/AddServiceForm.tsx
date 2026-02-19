'use client';

import { useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { addService } from '@/app/actions/services';
import toast from 'react-hot-toast';

interface AddServiceFormProps {
    profileId: number;
}

export function AddServiceForm({ profileId }: AddServiceFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.set('profile_id', profileId.toString());

        const result = await addService(formData);

        setIsSubmitting(false);

        if (result.success) {
            (e.target as HTMLFormElement).reset();
            toast.success('Услуга добавлена');
        } else {
            setError(result.error || 'Ошибка');
            toast.error(result.error || 'Ошибка при добавлении услуги');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-gray-100">
            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <input
                name="title"
                type="text"
                required
                placeholder="Название услуги"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
            />

            <div className="flex gap-2">
                <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Цена, €"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
                <input
                    name="duration"
                    type="number"
                    min="1"
                    required
                    placeholder="Мин"
                    className="w-24 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Plus className="w-4 h-4" />
                )}
                Добавить услугу
            </button>
        </form>
    );
}
