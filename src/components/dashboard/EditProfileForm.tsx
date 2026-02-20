'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { updateProfile } from '@/app/actions/updateProfile';
import toast from 'react-hot-toast';
import { CityCombobox } from '@/components/provider/CityCombobox';

interface EditProfileFormProps {
    profile: {
        id: number;
        name: string;
        bio: string | null;
        phone: string | null;
        city: string;
        address: string | null;
    };
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [city, setCity] = useState(profile.city);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!city) {
            setError('Выберите город из списка');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSaved(false);

        const formData = new FormData(e.currentTarget);
        formData.set('profile_id', profile.id.toString());

        const result = await updateProfile(formData);
        setIsSubmitting(false);

        if (result.success) {
            setSaved(true);
            toast.success('Профиль сохранен');
            setTimeout(() => setSaved(false), 3000);
        } else {
            setError(result.error || 'Ошибка');
            toast.error(result.error || 'Ошибка при сохранении профиля');
        }
    };

    const inputClass = "w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all";
    const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status messages */}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}
            {saved && (
                <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-xs">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Изменения сохранены!
                </div>
            )}

            {/* Name */}
            <div>
                <label className={labelClass}>Имя / Название</label>
                <input
                    name="name"
                    type="text"
                    required
                    defaultValue={profile.name}
                    className={inputClass}
                />
            </div>

            {/* Bio */}
            <div>
                <label className={labelClass}>О себе</label>
                <textarea
                    name="bio"
                    rows={4}
                    defaultValue={profile.bio || ''}
                    placeholder="Расскажите о себе, вашем опыте и специализации..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all resize-none"
                />
            </div>

            {/* Phone */}
            <div>
                <label className={labelClass}>Телефон</label>
                <input
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone || ''}
                    placeholder="+49 170 1234567"
                    className={inputClass}
                />
            </div>

            {/* City */}
            <div>
                <label className={labelClass}>Город</label>
                <CityCombobox name="city" value={city} onValueChange={setCity} />
            </div>

            {/* Address */}
            <div>
                <label className={labelClass}>Адрес</label>
                <input
                    name="address"
                    type="text"
                    defaultValue={profile.address || ''}
                    placeholder="Улица, дом"
                    className={inputClass}
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Save className="w-4 h-4" />
                )}
                Сохранить изменения
            </button>
        </form>
    );
}
