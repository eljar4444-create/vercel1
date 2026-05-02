'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Clock, Plus, Trash2, X, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createStaff, deleteStaff } from '@/app/actions/staff';
import { type ServicePhoto } from '@/components/dashboard/ServicePhotoUpload';
import { StaffManagementHub } from '@/components/dashboard/StaffManagementHub';
import { useTranslations } from 'next-intl';

export interface StaffPhotoService {
    id: number;
    title: string;
    portfolioPhotos: ServicePhoto[];
}

interface StaffSectionProps {
    staff: any[];
    services?: StaffPhotoService[];
}

export function StaffSection({ staff, services = [] }: StaffSectionProps) {
    const t = useTranslations('dashboard.provider.staffUi');
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [managingStaff, setManagingStaff] = useState<any | null>(null);

    const photoCountByStaffId = services.reduce<Record<string, number>>((acc, s) => {
        for (const p of s.portfolioPhotos) {
            if (p.staffId) acc[p.staffId] = (acc[p.staffId] ?? 0) + 1;
        }
        return acc;
    }, {});

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const res = await createStaff({ name, bio });
        if (res.success) {
            setIsAdding(false);
            setName('');
            setBio('');
        } else {
            setError(res.error || t('genericError'));
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm(t('deleteConfirm'))) return;
        setLoading(true);
        const res = await deleteStaff(id);
        if (!res.success) alert(res.error);
        setLoading(false);
    }

    return (
        <div className="space-y-6 bg-transparent">
            {!isAdding && (
                <div className="flex justify-end">
                    <Button
                        onClick={() => setIsAdding(true)}
                        className="rounded-full border border-gray-300 bg-transparent text-gray-900 hover:border-gray-900 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> {t('addStaff')}
                    </Button>
                </div>
            )}

            {isAdding && (
                <form onSubmit={handleAdd} className="bg-transparent border-l-2 border-gray-300 pl-4 py-2">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">{t('newStaff')}</h3>

                    {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-700">{t('staffName')} *</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                            placeholder={t('namePlaceholder')}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-xs font-medium text-slate-700">{t('specialtyBio')}</label>
                        <input
                            type="text"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                            placeholder={t('specialtyPlaceholder')}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={loading} className="bg-gray-900 text-white hover:bg-gray-700">
                            {loading ? t('saving') : t('save')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-full border border-gray-300 bg-transparent hover:border-gray-900">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-gray-300">
                {staff.map((s, idx) => (
                    <div
                        key={s.id}
                        onClick={() => setManagingStaff(s)}
                        className={`group relative flex items-center gap-4 bg-transparent border-b border-gray-200 px-5 py-5 cursor-pointer transition-colors hover:bg-gray-50/50 ${idx === 0 ? 'sm:pl-0' : ''}`}
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-300 text-stone-400">
                            {s.avatarUrl ? (
                                <Image
                                    src={s.avatarUrl}
                                    alt={s.name}
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-cover rounded-full"
                                />
                            ) : (
                                <UserIcon className="h-6 w-6" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                            <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-gray-900 transition-colors">{s.name}</h4>
                            {s.specialty && <p className="truncate text-xs text-stone-500 font-medium">{s.specialty}</p>}
                            {s.bio && <p className="truncate text-xs text-stone-400 mt-0.5 max-h-8 whitespace-normal line-clamp-2">{s.bio}</p>}
                            <div className="mt-1 flex items-center gap-2">
                                <p className="inline-flex items-center gap-1 text-[10px] text-stone-500">
                                    <Camera className="h-3 w-3" />
                                    {t('photoCount', { count: photoCountByStaffId[s.id] ?? 0 })}
                                </p>
                                {!s.schedule && <p className="text-[10px] text-amber-600 font-semibold">{t('generalSchedule')}</p>}
                            </div>
                        </div>
                        <div className="absolute right-3 top-3 flex items-center">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                disabled={loading}
                                className="text-stone-300 transition hover:text-red-500 p-2"
                                aria-label={t('deleteStaff')}
                                title={t('deleteStaff')}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {staff.length === 0 && !isAdding && (
                    <div className="col-span-full py-10 text-center text-sm text-stone-400">
                        {t('empty')}
                    </div>
                )}
            </div>

            {managingStaff && (
                <StaffManagementHub
                    staff={managingStaff}
                    services={services}
                    onClose={() => setManagingStaff(null)}
                />
            )}
        </div>
    );
}
