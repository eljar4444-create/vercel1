'use client';

import { useState } from 'react';
import { Camera, Plus, Trash2, X, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createStaff, deleteStaff } from '@/app/actions/staff';
import {
    StaffPhotosModal,
    type StaffPhotoService,
} from '@/components/dashboard/StaffPhotosModal';

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
    const [photosStaff, setPhotosStaff] = useState<{ id: string; name: string } | null>(
        null
    );

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
                    <div key={s.id} className="relative flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                            {s.avatarUrl ? (
                                <img src={s.avatarUrl} alt={s.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                                <UserIcon className="h-6 w-6" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="truncate text-sm font-bold text-slate-900">{s.name}</h4>
                            {s.bio && <p className="truncate text-xs text-stone-500">{s.bio}</p>}
                            {!s.schedule && <p className="mt-1 text-[10px] text-amber-600 font-semibold">Общее расписание</p>}
                        </div>
                        <div className="absolute right-3 top-3 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPhotosStaff({ id: s.id, name: s.name })}
                                className="text-stone-300 transition hover:text-amber-600"
                                aria-label="Фотографии работ"
                                title="Фотографии работ"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(s.id)}
                                disabled={loading}
                                className="text-stone-300 transition hover:text-red-500"
                                aria-label="Удалить мастера"
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

            {photosStaff && (
                <StaffPhotosModal
                    staff={photosStaff}
                    services={services}
                    onClose={() => setPhotosStaff(null)}
                />
            )}
        </div>
    );
}
