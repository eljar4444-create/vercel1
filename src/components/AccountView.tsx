'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateBasicInfo, uploadProfilePhoto } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Package, User as UserIcon, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    role: string;
    _count?: {
        // orders: number; // Deleted
    }
}

export function AccountView({ user }: { user: User }) {
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
            toast.success('Профиль обновлен!');
            router.refresh();
        } catch (error) {
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
            router.refresh();
        } catch (error) {
            toast.error('Ошибка загрузки фото');
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-orange-50 bg-gray-100">
                            {user.image ? (
                                <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🐱</div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                            <Camera className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                    </div>
                    <h2 className="text-xl font-bold mb-1">{user.name || 'Пользователь'}</h2>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                    <div className="mt-4 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                        {user.role === 'PROVIDER' ? 'Исполнитель' : 'Клиент'}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <nav className="flex flex-col p-2">
                        {/* Orders Link Removed */}
                        <button onClick={() => signOut()} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition text-left w-full mt-2">
                            <LogOut className="w-5 h-5" />
                            <div className="font-medium">Выйти</div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
                <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-orange-500" />
                        Основная информация
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 pl-1">Ваше имя</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 text-lg"
                                placeholder="Иван Иванов"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 pl-1">О себе</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                placeholder="Расскажите немного о себе..."
                            />
                            <p className="text-xs text-gray-400 mt-2 pl-1">Эту информацию могут видеть исполнители при отклике на ваши заказы.</p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 h-auto text-lg rounded-xl">
                                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
