'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateBasicInfo, uploadProfilePhoto } from '@/app/actions/profile';
import { deleteUserAccount } from '@/app/actions/deleteAccount';
import { Camera, User as UserIcon, ArrowLeft, BellRing, ShieldAlert, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('dashboard.accountSettings');
    const { update: updateSession } = useSession();

    const sections = useMemo(
        () => [
            { id: 'profile', label: t('sections.profile'), icon: UserIcon },
            { id: 'notifications', label: t('sections.notifications'), icon: BellRing },
            { id: 'security', label: t('sections.security'), icon: ShieldAlert },
        ] as const,
        [t]
    );

    const [activeSection, setActiveSection] = useState<(typeof sections)[number]['id']>('profile');
    const [name, setName] = useState(user.name || '');
    const [bio, setBio] = useState(user.bio || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
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

    const initials = user.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';

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
            toast.success(t('toasts.profileUpdated'));
            router.refresh();
        } catch {
            toast.error(t('toasts.saveError'));
        } finally {
            setIsSaving(false);
        }
    }

    async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        // Instant preview
        setAvatarPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const result = await uploadProfilePhoto(formData);
            if (!result.success) {
                setAvatarPreview(user.image);
                toast.error(result.error || t('toasts.photoUploadError'));
                return;
            }

            toast.success(t('toasts.photoUpdated'));

            // Update local preview with permanent URL
            if (result.imageUrl) {
                setAvatarPreview(result.imageUrl);
            }

            // Sync NextAuth session so Header avatar updates immediately
            await updateSession({ image: result.imageUrl });
            router.refresh();
        } catch {
            // Revert preview on error
            setAvatarPreview(user.image);
            toast.error(t('toasts.photoUploadError'));
        }
    }

    function handleNotificationToggle(key: keyof typeof notifications) {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error(t('toasts.passwordFieldsRequired'));
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t('toasts.passwordMismatch'));
            return;
        }

        toast.success(t('toasts.passwordSoon'));
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
                    {t('back')}
                </Link>
                <h1 className="mt-3 text-2xl font-bold text-gray-900">{t('title')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
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
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt={user.name || 'User'} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-2xl font-bold text-gray-600">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-gray-900 p-2 text-white shadow-lg transition hover:bg-gray-800">
                                        <Camera className="h-4 w-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                    </label>
                                </div>
                                <h2 className="mb-1 text-lg font-semibold text-gray-900">{user.name || t('userFallback')}</h2>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>

                            <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                                    <UserIcon className="h-6 w-6 text-orange-500" />
                                    {t('profile.title')}
                                </h3>

                                <div className="space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('profile.name')}</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-11"
                                            placeholder={t('profile.namePlaceholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                                        <Input value={user.email || ''} readOnly className="h-11 cursor-not-allowed bg-gray-50 text-gray-500" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('profile.phone')}</label>
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-11"
                                            placeholder="+49 123 456 7890"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('profile.bio')}</label>
                                        <Textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="min-h-[120px]"
                                            placeholder={t('profile.bioPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button type="submit" disabled={isSaving} className="bg-gray-900 text-white hover:bg-gray-800">
                                        {isSaving ? t('saving') : t('profile.save')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <h3 className="mb-1 text-xl font-bold text-gray-900">{t('notifications.title')}</h3>
                            <p className="mb-6 text-sm text-gray-500">
                                {t('notifications.subtitle')}
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('notifications.remindersTitle')}</p>
                                        <p className="text-xs text-gray-500">{t('notifications.remindersBody')}</p>
                                    </div>
                                    <NotificationToggle
                                        value={notifications.reminders}
                                        onToggle={() => handleNotificationToggle('reminders')}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('notifications.chatTitle')}</p>
                                        <p className="text-xs text-gray-500">{t('notifications.chatBody')}</p>
                                    </div>
                                    <NotificationToggle
                                        value={notifications.chat}
                                        onToggle={() => handleNotificationToggle('chat')}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('notifications.systemTitle')}</p>
                                        <p className="text-xs text-gray-500">{t('notifications.systemBody')}</p>
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
                                <h3 className="mb-1 text-xl font-bold text-gray-900">{t('security.passwordTitle')}</h3>
                                <p className="mb-6 text-sm text-gray-500">
                                    {t('security.passwordBody')}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('security.currentPassword')}</label>
                                        <Input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('security.newPassword')}</label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('security.confirmPassword')}</label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
                                        {t('security.updatePassword')}
                                    </Button>
                                </div>
                            </form>

                            <div className="rounded-3xl border border-red-200 bg-red-50/70 p-6">
                                <h4 className="text-base font-semibold text-red-700">{t('security.dangerTitle')}</h4>
                                <p className="mt-2 text-sm text-red-700/90">
                                    {t('security.dangerBody')}
                                </p>
                                <Button
                                    variant="destructive"
                                    className="mt-4"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    {t('security.deleteAccount')}
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
                                            {t('deleteModal.title')}
                                        </h3>
                                        <p className="mt-2 text-center text-sm text-gray-500">
                                            {t('deleteModal.body')}
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
                                                            toast.success(t('toasts.accountDeleted'));
                                                            signOut({ callbackUrl: '/' });
                                                        } else {
                                                            toast.error(result.error || t('toasts.deleteError'));
                                                            setIsDeleting(false);
                                                        }
                                                    } catch {
                                                        toast.error(t('toasts.deleteError'));
                                                        setIsDeleting(false);
                                                    }
                                                }}
                                            >
                                                {isDeleting ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('deleteModal.deleting')}</>
                                                ) : (
                                                    t('deleteModal.confirm')
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full sm:w-auto"
                                                disabled={isDeleting}
                                                onClick={() => setShowDeleteModal(false)}
                                            >
                                                {t('deleteModal.cancel')}
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
