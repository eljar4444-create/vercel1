'use client';

import { useState } from 'react';
import { registerPro } from '@/app/actions/registerPro';
import {
    Loader2, CheckCircle, AlertCircle,
    User, Mail, MapPin, Tag
} from 'lucide-react';

interface ProFormProps {
    categories: { id: number; name: string; slug: string; icon: string | null }[];
}

export function ProRegistrationForm({ categories }: ProFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await registerPro(formData);

        setIsSubmitting(false);

        if (result.success) {
            setIsSuccess(true);
        } else {
            setError(result.error || 'Произошла ошибка.');
        }
    };

    // ─── Success state ──────────────────────────────────────────────
    if (isSuccess) {
        return (
            <div className="bg-white rounded-2xl border border-green-100 p-10 text-center shadow-sm">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Заявка принята!</h3>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Спасибо! Мы свяжемся с вами для активации профиля.
                    Обычно это занимает 1-2 рабочих дня.
                </p>
            </div>
        );
    }

    // ─── Form ───────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Регистрация специалиста</h3>
                <p className="text-sm text-gray-400">Заполните форму — мы свяжемся с вами</p>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Name */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Имя / Название салона
                </label>
                <input
                    name="name"
                    type="text"
                    required
                    placeholder="Елена Петрова или Beauty Studio"
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
            </div>

            {/* Email */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email
                </label>
                <input
                    name="email"
                    type="email"
                    required
                    placeholder="master@example.com"
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
            </div>

            {/* City */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Город
                </label>
                <input
                    name="city"
                    type="text"
                    required
                    placeholder="Berlin, München, Hamburg..."
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
            </div>

            {/* Category */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    Категория
                </label>
                <select
                    name="category_id"
                    required
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                    <option value="">Выберите категорию</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Отправка...
                    </>
                ) : (
                    'Зарегистрироваться'
                )}
            </button>

            <p className="text-xs text-gray-400 text-center">
                Нажимая кнопку, вы соглашаетесь с условиями сервиса
            </p>
        </form>
    );
}
