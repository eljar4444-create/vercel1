'use client';

import { useState } from 'react';
import { Camera, Clock, Plus, Trash2, X, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createStaff, deleteStaff } from '@/app/actions/staff';
import { type ServicePhoto } from '@/components/dashboard/ServicePhotoUpload';
import { StaffManagementHub } from '@/components/dashboard/StaffManagementHub';

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
            setError(res.error || 'Ошибка');
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Удалить мастера? Все записи к нему останутся, но он исчезнет из формы бронирования.')) return;
        setLoading(true);
        const res = await deleteStaff(id);
        if (!res.success) alert(res.error);
        setLoading(false);
    }

    return (
        <div className="space-y-4 p-5">
            {!isAdding && (
                <div className="flex justify-end">
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Добавить мастера
                    </Button>
                </div>
            )}

            {isAdding && (
                <form onSubmit={handleAdd} className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Новый мастер</h3>
                    
                    {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                    
                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-700">Имя мастера *</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border-stone-300 shadow-sm focus:border-amber-400 focus:ring-amber-400 sm:text-sm"
                            placeholder="Например: Анна"
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="mb-1 block text-xs font-medium text-slate-700">Специализация / Био</label>
                        <input
                            type="text"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full rounded-lg border-stone-300 shadow-sm focus:border-amber-400 focus:ring-amber-400 sm:text-sm"
                            placeholder="Топ-стилист, колорист"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={loading} className="bg-amber-400 text-stone-900 hover:bg-amber-500">
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((s) => (
                    <div 
                        key={s.id} 
                        onClick={() => setManagingStaff(s)}
                        className="group relative flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-stone-300 cursor-pointer"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400 ring-2 ring-transparent transition group-hover:ring-amber-200">
                            {s.avatarUrl ? (
                                <img src={s.avatarUrl} alt={s.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                                <UserIcon className="h-6 w-6" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pr-24">
                            <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{s.name}</h4>
                            {s.specialty && <p className="truncate text-xs text-stone-500 font-medium">{s.specialty}</p>}
                            {s.bio && <p className="truncate text-xs text-stone-400 mt-0.5 max-h-8 whitespace-normal line-clamp-2">{s.bio}</p>}
                            <div className="mt-1 flex items-center gap-2">
                                <p className="inline-flex items-center gap-1 text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                    <Camera className="h-3 w-3" />
                                    {photoCountByStaffId[s.id] ?? 0} фото
                                </p>
                                {!s.schedule && <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Общее расписание</p>}
                            </div>
                        </div>
                        <div className="absolute right-3 top-3 flex items-center bg-white/80 backdrop-blur pl-2 rounded-l-md">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                disabled={loading}
                                className="text-stone-300 transition hover:text-red-500 p-2"
                                aria-label="Удалить мастера"
                                title="Удалить мастера"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                
                {staff.length === 0 && !isAdding && (
                    <div className="col-span-full py-10 text-center text-sm text-stone-400">
                        В вашем салоне еще нет добавленных мастеров.
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
