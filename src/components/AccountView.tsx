'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateBasicInfo, uploadProfilePhoto } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, User as UserIcon, LogOut, Compass, CalendarClock, Sparkles, CheckCircle2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    role: string;
}

interface AccountViewProps {
    user: User;
    stats: {
        totalBookings: number;
        upcomingBookings: number;
    };
}

export function AccountView({ user, stats }: AccountViewProps) {
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
        <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-300">Client Area</p>
                <h1 className="mt-2 text-3xl font-bold">
                    {user.name ? `Привет, ${user.name}!` : 'Добро пожаловать!'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-300">
                    Здесь вы управляете профилем и записями: находите мастеров, бронируете время и отслеживаете визиты.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/10 px-4 py-3">
                        <p className="text-[11px] text-gray-300">Всего записей</p>
                        <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3">
                        <p className="text-[11px] text-gray-300">Предстоящие</p>
                        <p className="text-2xl font-bold">{stats.upcomingBookings}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-4 py-3">
                        <p className="text-[11px] text-gray-300">Статус</p>
                        <p className="text-lg font-semibold">{user.role === 'CLIENT' ? 'Клиент' : user.role}</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild className="bg-[#fc0] text-black hover:bg-[#e6b800]">
                        <Link href="/search">
                            <Compass className="mr-2 h-4 w-4" />
                            Найти мастера
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                        <Link href="/my-bookings">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Мои записи
                        </Link>
                    </Button>
                </div>
            </div>

            {stats.totalBookings === 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h2 className="text-sm font-bold text-blue-900">Что делать дальше</h2>
                    <div className="mt-3 grid gap-2 text-sm text-blue-900 sm:grid-cols-3">
                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                            <span className="font-semibold">1.</span> Выберите услугу в поиске
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                            <span className="font-semibold">2.</span> Забронируйте удобный слот
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                            <span className="font-semibold">3.</span> Следите за записью в кабинете
                        </div>
                    </div>
                    <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href="/search">Перейти к поиску</Link>
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4 group">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-orange-50 bg-gray-100">
                                {user.image ? (
                                    <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">👋</div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        <h2 className="text-xl font-bold mb-1">{user.name || 'Пользователь'}</h2>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full text-xs font-medium text-green-700 border border-green-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Аккаунт активен
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <nav className="flex flex-col p-2">
                            <button onClick={() => signOut()} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition text-left w-full mt-2">
                                <LogOut className="w-5 h-5" />
                                <div className="font-medium">Выйти</div>
                            </button>
                        </nav>
                    </div>
                </div>

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
                                <p className="text-xs text-gray-400 mt-2 pl-1">Эту информацию могут видеть мастера перед визитом.</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 h-auto text-lg rounded-xl">
                                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            Подсказка
                        </div>
                        <p className="mt-2">
                            Чтобы запись проходила быстрее, добавьте имя и кратко опишите предпочтения в поле «О себе».
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
