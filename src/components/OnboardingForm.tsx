'use client';

import { useState } from 'react';
import { Loader2, Building2, Scissors, MapPin } from 'lucide-react';
import { completeProviderOnboarding } from '@/app/actions/onboarding';
import { toast } from 'react-hot-toast';

interface OnboardingFormProps {
    providerType: string; // 'SALON' | 'INDIVIDUAL' | 'PRIVATE'
    userName: string | null;
}

export function OnboardingForm({ providerType, userName }: OnboardingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSalon = providerType === 'SALON';

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const result = await completeProviderOnboarding(formData);

        if (result && !result.success) {
            toast.error(result.error || 'Ошибка сохранения');
            setIsSubmitting(false);
        }
        // On success, server action redirects automatically
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-16">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        {isSalon ? <Building2 className="h-6 w-6" /> : <Scissors className="h-6 w-6" />}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {isSalon ? 'Регистрация салона' : 'Регистрация мастера'}
                    </h1>
                    <p className="mt-2 text-base text-gray-500">
                        {userName ? `Привет, ${userName}! ` : ''}
                        Заполните данные, чтобы завершить регистрацию.
                    </p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
                    <input type="hidden" name="providerType" value={providerType} />

                    {/* Salon-specific fields */}
                    {isSalon && (
                        <div className="mb-8 space-y-5">
                            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                                <Building2 className="h-4 w-4" />
                                Данные компании
                            </h3>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Название салона <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="companyName"
                                    required
                                    placeholder="Beauty Studio Berlin"
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Steuernummer / USt-IdNr
                                </label>
                                <input
                                    name="taxId"
                                    placeholder="DE123456789"
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                />
                            </div>
                        </div>
                    )}

                    {/* Individual-specific fields */}
                    {!isSalon && (
                        <div className="mb-8">
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300">
                                <input
                                    type="checkbox"
                                    name="isKleinunternehmer"
                                    className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        Я работаю как Kleinunternehmer (§19 UStG)
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Освобождение от НДС при обороте до 22.000 € в год
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Address fields */}
                    <div className="space-y-5">
                        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                            <MapPin className="h-4 w-4" />
                            Адрес
                        </h3>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Улица и номер дома <span className="text-red-400">*</span>
                            </label>
                            <input
                                name="address"
                                required
                                placeholder="Musterstraße 12"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Почтовый индекс <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="zipCode"
                                    required
                                    placeholder="10115"
                                    pattern="[0-9]{4,5}"
                                    title="Введите 4-5 цифр"
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Город <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="city"
                                    required
                                    placeholder="Berlin"
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="
                            mt-8 flex w-full items-center justify-center gap-2
                            h-12 rounded-xl bg-slate-900 text-sm font-semibold text-white
                            transition-all duration-200
                            hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10
                            active:scale-[0.98]
                            disabled:opacity-60 disabled:cursor-not-allowed
                        "
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Сохранение...
                            </>
                        ) : (
                            'Завершить регистрацию'
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
