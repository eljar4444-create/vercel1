'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, Save, Upload, X } from 'lucide-react';
import { updateProfile } from '@/app/actions/updateProfile';
import { disconnectTelegram } from '@/app/actions/telegram';
import { uploadServicePhoto } from '@/app/actions/upload';
import toast from 'react-hot-toast';
import { CityCombobox } from '@/components/provider/CityCombobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function TelegramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    );
}

interface EditProfileFormProps {
    profile: {
        id: number;
        name: string;
        providerType: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
        bio: string | null;
        phone: string | null;
        telegramChatId: string | null;
        city: string;
        address: string | null;
        studioImages: string[];
    };
    connectTelegramLink: string | null;
}

export function EditProfileForm({ profile, connectTelegramLink }: EditProfileFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState(profile.name);
    const [bio, setBio] = useState(profile.bio || '');
    const [city, setCity] = useState(profile.city);
    const [providerType, setProviderType] = useState<'SALON' | 'PRIVATE' | 'INDIVIDUAL'>(profile.providerType);
    const [studioImages, setStudioImages] = useState<string[]>(profile.studioImages || []);
    const [isUploadingStudio, setIsUploadingStudio] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

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
        if (!city || !city.trim()) {
            setError('Выберите город из списка');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSaved(false);

        const formData = new FormData(e.currentTarget);
        formData.set('profile_id', profile.id.toString());
        formData.set('studioImages', JSON.stringify(studioImages));
        formData.set('city', city.trim());
        formData.set('provider_type', providerType);
        formData.set('name', name.trim());
        formData.set('bio', bio);

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

    const inputClass = 'w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all';
    const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
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

            <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-slate-100 p-1">
                    <TabsTrigger value="main" className="rounded-xl text-xs sm:text-sm">
                        Основное
                    </TabsTrigger>
                    <TabsTrigger value="location" className="rounded-xl text-xs sm:text-sm">
                        Локация
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-xl text-xs sm:text-sm">
                        Уведомления
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="rounded-xl text-xs sm:text-sm">
                        Фото студии
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="mt-3 space-y-3 rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
                    <div>
                        <label className={labelClass}>Имя / Название</label>
                        <input
                            name="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Тип исполнителя</label>
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
                                Я представляю салон
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
                                Я частный мастер
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>О себе / О салоне</label>
                        <textarea
                            name="bio"
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Расскажите о вашем опыте, подходе к работе и материалах, которые вы используете..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all resize-none"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="location" className="mt-3 space-y-3 rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
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
                </TabsContent>

                <TabsContent value="notifications" className="mt-3 space-y-3 rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Telegram-уведомления</h3>
                        {profile.telegramChatId ? (
                            <>
                                <p className="flex items-center gap-2 text-sm text-green-700">
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                    Telegram успешно подключен
                                </p>
                                <button
                                    type="button"
                                    disabled={isDisconnecting}
                                    onClick={async () => {
                                        setIsDisconnecting(true);
                                        const result = await disconnectTelegram(profile.id);
                                        setIsDisconnecting(false);
                                        if (result.success) {
                                            toast.success('Telegram отключён');
                                            router.refresh();
                                        } else {
                                            toast.error(result.error || 'Ошибка');
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Отключить
                                </button>
                            </>
                        ) : connectTelegramLink ? (
                            <a
                                href={connectTelegramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0077b5]"
                            >
                                <TelegramIcon className="h-5 w-5" />
                                Подключить Telegram-бота
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Ссылка для подключения недоступна. Укажите TELEGRAM_BOT_USERNAME в настройках сервера.
                            </p>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="photos" className="mt-3 space-y-2 rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
                    <label className={labelClass}>Фотографии студии / Интерьер</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {studioImages.map((url, idx) => (
                            <div key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
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
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400">
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
                </TabsContent>
            </Tabs>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting || isUploadingStudio}
                className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
