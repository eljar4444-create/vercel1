'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createProviderProfile } from '@/app/actions/providerOnboarding';
import { CityCombobox } from '@/components/provider/CityCombobox';
import { useTranslations } from 'next-intl';

export function ProviderOnboardingForm({
    email,
    defaultName,
    defaultCategoryId,
}: {
    email: string;
    defaultName?: string | null;
    defaultCategoryId?: number | null;
}) {
    const t = useTranslations('forms.providerOnboarding');
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [city, setCity] = useState('');
    const [providerType, setProviderType] = useState<'SALON' | 'PRIVATE' | 'INDIVIDUAL'>('PRIVATE');

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!city) {
            setError(t('cityRequired'));
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);
        const result = await createProviderProfile(formData);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error || t('genericSaveError'));
            return;
        }

        setSuccess(t('draftSaved'));
        if (result.profileId) {
            router.push('/dashboard');
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('nameLabel')}</label>
                <input
                    name="name"
                    defaultValue={defaultName || ''}
                    required
                    placeholder="Beauty Studio Berlin"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('city')}</label>
                <CityCombobox name="city" value={city} onValueChange={setCity} />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('providerType')}</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <input
                            type="radio"
                            name="provider_type"
                            value="SALON"
                            checked={providerType === 'SALON'}
                            onChange={() => setProviderType('SALON')}
                            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-300"
                        />
                        {t('salonOption')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <input
                            type="radio"
                            name="provider_type"
                            value="PRIVATE"
                            checked={providerType === 'PRIVATE'}
                            onChange={() => setProviderType('PRIVATE')}
                            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-300"
                        />
                        {t('privateOption')}
                    </label>
                </div>
            </div>

            {providerType === 'SALON' ? (
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('salonAddress')}</label>
                    <input
                        name="address"
                        required
                        placeholder="Musterstrasse 12, 95444 Bayreuth"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                    />
                </div>
            ) : null}

            <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('bioLabel')}</label>
                <textarea
                    name="bio"
                    rows={4}
                    placeholder={t('bioPlaceholder')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:ring-2 focus:ring-gray-300"
                />
            </div>

            <input type="hidden" name="category_id" value={defaultCategoryId ?? ''} />

            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('createProfile')}
            </button>
        </form>
    );
}
