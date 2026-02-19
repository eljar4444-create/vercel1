'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createProviderProfile } from '@/app/actions/providerOnboarding';

type Category = { id: number; name: string; icon: string | null };

export function ProviderOnboardingForm({
    categories,
    email,
    defaultName,
}: {
    categories: Category[];
    email: string;
    defaultName?: string | null;
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);
        const result = await createProviderProfile(formData);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error || 'Ошибка сохранения.');
            return;
        }

        setSuccess('Профиль создан. Переходим в кабинет...');
        if (result.profileId) {
            router.push(`/dashboard/${result.profileId}`);
            router.refresh();
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {success}
                </div>
            )}

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
                <input
                    value={email}
                    disabled
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm text-gray-700"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Имя / Салон</label>
                <input
                    name="name"
                    defaultValue={defaultName || ''}
                    required
                    placeholder="Beauty Studio Berlin"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Город</label>
                <input
                    name="city"
                    required
                    placeholder="Berlin"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Категория</label>
                <select
                    name="category_id"
                    required
                    defaultValue=""
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                >
                    <option value="" disabled>Выберите категорию</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.icon ? `${category.icon} ` : ''}{category.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Создать профиль мастера
            </button>
        </form>
    );
}
