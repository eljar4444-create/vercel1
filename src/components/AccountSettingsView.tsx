'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateBasicInfo, uploadProfilePhoto } from '@/app/actions/profile';
import { Camera, User as UserIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
}

interface AccountSettingsViewProps {
    user: User;
}

export function AccountSettingsView({ user }: AccountSettingsViewProps) {
    const [name, setName] = useState(user.name || '');
    const [bio, setBio] = useState(user.bio || '');
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);

        try {
            await updateBasicInfo(formData);
            toast.success('Профиль обновлен');
            router.refresh();
        } catch {
            toast.error('Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    }

    async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return;

        const formData = new FormData();
        formData.append('photo', e.target.files[0]);

        try {
            await uploadProfilePhoto(formData);
            toast.success('Фото обновлено');
            router.refresh();
        } catch {
            toast.error('Ошибка загрузки фото');
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад в кабинет
                </Link>
                <h1 className="mt-3 text-2xl font-bold text-gray-900">Настройки аккаунта</h1>
                <p className="mt-1 text-sm text-gray-500">Обновите имя, фото профиля и информацию о себе.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-6">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                        <div className="relative mx-auto mb-4 h-32 w-32">
                            <div className="h-full w-full overflow-hidden rounded-full border-4 border-orange-50 bg-gray-100">
                                {user.image ? (
                                    <img src={user.image} alt={user.name || 'User'} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-4xl">👋</div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-2 text-white shadow-lg transition hover:bg-blue-700">
                                <Camera className="h-4 w-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        <h2 className="mb-1 text-xl font-bold">{user.name || 'Пользователь'}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-6 md:col-span-2">
                    <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold">
                            <UserIcon className="h-6 w-6 text-orange-500" />
                            Основная информация
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block pl-1 text-sm font-medium text-gray-700">Ваше имя</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 text-lg"
                                    placeholder="Иван Иванов"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block pl-1 text-sm font-medium text-gray-700">О себе</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="h-32 w-full resize-none rounded-xl border border-gray-200 bg-white p-4 outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="Расскажите немного о себе..."
                                />
                                <p className="mt-2 pl-1 text-xs text-gray-400">
                                    Эту информацию могут видеть мастера перед визитом.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-auto rounded-xl bg-blue-600 px-8 py-6 text-lg text-white hover:bg-blue-700"
                                >
                                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
