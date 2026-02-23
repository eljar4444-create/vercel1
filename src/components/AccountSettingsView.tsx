'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateBasicInfo, uploadProfilePhoto } from '@/app/actions/profile';
import { deleteUserAccount } from '@/app/actions/deleteAccount';
import { Camera, User as UserIcon, ArrowLeft, BellRing, ShieldAlert, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    phone?: string | null;
}

interface AccountSettingsViewProps {
    user: User;
}

export function AccountSettingsView({ user }: AccountSettingsViewProps) {
    const sections = useMemo(
        () => [
            { id: 'profile', label: 'Мой профиль', icon: UserIcon },
            { id: 'notifications', label: 'Уведомления', icon: BellRing },
            { id: 'security', label: 'Безопасность', icon: ShieldAlert },
        ] as const,
        []
    );

    const [activeSection, setActiveSection] = useState<(typeof sections)[number]['id']>('profile');
    const [name, setName] = useState(user.name || '');
    const [bio, setBio] = useState(user.bio || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState({
        reminders: true,
        chat: true,
        system: true,
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storageKey = `client-phone:${user.id}`;
        const savedPhone = window.localStorage.getItem(storageKey);
        if (!user.phone && savedPhone) {
            setPhone(savedPhone);
        }
    }, [user.id, user.phone]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('phone', phone);

        try {
            await updateBasicInfo(formData);
            window.localStorage.setItem(`client-phone:${user.id}`, phone);
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

    function handleNotificationToggle(key: keyof typeof notifications) {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Заполните все поля для смены пароля');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Новый пароль и подтверждение не совпадают');
            return;
        }

        toast.success('Смена пароля будет подключена в следующем обновлении');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }

    const NotificationToggle = ({
        value,
        onToggle,
    }: {
        value: boolean;
        onToggle: () => void;
    }) => (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={value}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${value ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-gray-200'
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${value ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
            />
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад в кабинет
                </Link>
                <h1 className="mt-3 text-2xl font-bold text-gray-900">Настройки аккаунта</h1>
                <p className="mt-1 text-sm text-gray-500">Управляйте профилем, уведомлениями и безопасностью.</p>
            </div>

            <div className="md:hidden">
                <div className="relative">
                    <select
                        value={activeSection}
                        onChange={(e) => setActiveSection(e.target.value as (typeof sections)[number]['id'])}
                        className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-gray-100"
                    >
                        {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                                {section.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
                <aside className="hidden md:block">
                    <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${isActive
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {section.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section className="space-y-6">
                    {activeSection === 'profile' && (
                        <div className="space-y-6">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                                <div className="relative mx-auto mb-4 h-28 w-28">
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
                                <h2 className="mb-1 text-lg font-semibold text-gray-900">{user.name || 'Пользователь'}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>

                            <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                                    <UserIcon className="h-6 w-6 text-orange-500" />
                                    Мой профиль
                                </h3>

                                <div className="space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Имя</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-11"
                                            placeholder="Иван Иванов"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                                        <Input value={user.email || ''} readOnly className="h-11 cursor-not-allowed bg-gray-50 text-gray-500" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Номер телефона</label>
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-11"
                                            placeholder="+49 123 456 7890"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">О себе</label>
                                        <Textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="min-h-[120px]"
                                            placeholder="Расскажите немного о себе..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button type="submit" disabled={isSaving} className="bg-gray-900 text-white hover:bg-gray-800">
                                        {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <h3 className="mb-1 text-xl font-bold text-gray-900">Уведомления</h3>
                            <p className="mb-6 text-sm text-gray-500">
                                Управляйте тем, какие уведомления вы хотите получать.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Напоминания о записях</p>
                                        <p className="text-xs text-gray-500">Email/SMS перед визитом</p>
                                    </div>
                                    <NotificationToggle
                                        value={notifications.reminders}
                                        onToggle={() => handleNotificationToggle('reminders')}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Сообщения в чате</p>
                                        <p className="text-xs text-gray-500">Уведомлять о новых сообщениях</p>
                                    </div>
                                    <NotificationToggle
                                        value={notifications.chat}
                                        onToggle={() => handleNotificationToggle('chat')}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Системные уведомления</p>
                                        <p className="text-xs text-gray-500">Изменения статуса аккаунта</p>
                                    </div>
                                    <NotificationToggle
                                        value={notifications.system}
                                        onToggle={() => handleNotificationToggle('system')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6">
                            <form onSubmit={handleChangePassword} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                                <h3 className="mb-1 text-xl font-bold text-gray-900">Смена пароля</h3>
                                <p className="mb-6 text-sm text-gray-500">
                                    Используйте сложный пароль, чтобы защитить ваш аккаунт.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Текущий пароль</label>
                                        <Input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Новый пароль</label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Подтверждение</label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
                                        Обновить пароль
                                    </Button>
                                </div>
                            </form>

                            <div className="rounded-3xl border border-red-200 bg-red-50/70 p-6">
                                <h4 className="text-base font-semibold text-red-700">Опасная зона</h4>
                                <p className="mt-2 text-sm text-red-700/90">
                                    Удаление аккаунта приведет к безвозвратной потере ваших данных.
                                </p>
                                <Button
                                    variant="destructive"
                                    className="mt-4"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    Удалить аккаунт
                                </Button>
                            </div>

                            {/* Delete confirmation modal */}
                            {showDeleteModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                            <AlertTriangle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <h3 className="text-center text-lg font-semibold text-gray-900">
                                            Удалить аккаунт?
                                        </h3>
                                        <p className="mt-2 text-center text-sm text-gray-500">
                                            Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо, и все
                                            ваши данные будут удалены навсегда.
                                        </p>
                                        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                                            <Button
                                                variant="destructive"
                                                className="w-full sm:w-auto"
                                                disabled={isDeleting}
                                                onClick={async () => {
                                                    setIsDeleting(true);
                                                    try {
                                                        const result = await deleteUserAccount();
                                                        if (result.success) {
                                                            toast.success('Аккаунт удалён');
                                                            signOut({ callbackUrl: '/' });
                                                        } else {
                                                            toast.error(result.error || 'Ошибка при удалении');
                                                            setIsDeleting(false);
                                                        }
                                                    } catch {
                                                        toast.error('Ошибка при удалении аккаунта');
                                                        setIsDeleting(false);
                                                    }
                                                }}
                                            >
                                                {isDeleting ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Удаление...</>
                                                ) : (
                                                    'Да, удалить аккаунт'
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                                disabled={isDeleting}
                                                onClick={() => setShowDeleteModal(false)}
                                            >
                                                Отмена
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
