'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Save, Upload, X } from 'lucide-react';
import { updateProfile } from '@/app/actions/updateProfile';
import { uploadServicePhoto } from '@/app/actions/upload';
import toast from 'react-hot-toast';
import { CityCombobox } from '@/components/provider/CityCombobox';

interface EditProfileFormProps {
    profile: {
        id: number;
        name: string;
        providerType: 'SALON' | 'PRIVATE';
        bio: string | null;
        phone: string | null;
        city: string;
        address: string | null;
        studioImages: string[];
    };
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [city, setCity] = useState(profile.city);
    const [providerType, setProviderType] = useState<'SALON' | 'PRIVATE'>(profile.providerType);
    const [studioImages, setStudioImages] = useState<string[]>(profile.studioImages || []);
    const [isUploadingStudio, setIsUploadingStudio] = useState(false);

    const handleUploadStudioImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingStudio(true);
        try {
            let currentCount = studioImages.length;
            for (const file of Array.from(files)) {
                if (currentCount >= 8) {
                    toast.error('Можно загрузить максимум 8 фото студии.');
                    break;
                }
                const payload = new FormData();
                payload.append('photo', file);
                const result = await uploadServicePhoto(payload);
                if (result.success && result.imageUrl) {
                    currentCount += 1;
                    setStudioImages((prev) => [...prev, result.imageUrl]);
                }
            }
        } catch (uploadError: any) {
            toast.error(uploadError?.message || 'Не удалось загрузить фото');
        } finally {
            setIsUploadingStudio(false);
            event.target.value = '';
        }
    };

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
        formData.set('studioImages', JSON.stringify(studioImages));

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

            <div>
                <label className={labelClass}>Тип исполнителя</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <input
                            type="radio"
                            name="provider_type"
                            value="SALON"
                            checked={providerType === 'SALON'}
                            onChange={() => setProviderType('SALON')}
                            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-300"
                        />
                        Я представляю салон
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <input
                            type="radio"
                            name="provider_type"
                            value="PRIVATE"
                            checked={providerType === 'PRIVATE'}
                            onChange={() => setProviderType('PRIVATE')}
                            className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-300"
                        />
                        Я частный мастер
                    </label>
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className={labelClass}>О себе / О салоне</label>
                <textarea
                    name="bio"
                    rows={4}
                    defaultValue={profile.bio || ''}
                    placeholder="Расскажите о вашем опыте, подходе к работе и материалах, которые вы используете..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className={labelClass}>Фотографии студии / Интерьер</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {studioImages.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            <img src={url} alt={`studio-${idx + 1}`} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setStudioImages((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label="Удалить фото"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400">
                        {isUploadingStudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="mt-1 text-[11px]">Добавить</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleUploadStudioImages}
                            disabled={isUploadingStudio || studioImages.length >= 8}
                        />
                    </label>
                </div>
                <p className="text-xs text-gray-500">До 8 фото ({studioImages.length}/8)</p>
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

            {providerType === 'SALON' ? (
                <div>
                    <label className={labelClass}>Полный адрес салона</label>
                    <input
                        name="address"
                        type="text"
                        required
                        defaultValue={profile.address || ''}
                        placeholder="Улица, дом"
                        className={inputClass}
                    />
                </div>
            ) : null}

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting || isUploadingStudio}
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
