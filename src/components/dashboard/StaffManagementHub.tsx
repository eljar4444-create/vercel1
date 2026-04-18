'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Link from 'next/link';

// API Actions
import {
    updateStaffProfile,
    getStaffAvailability,
    updateStaffAvailability,
    type StaffAvailabilityDay,
} from '@/app/actions/staff';

// Subcomponents
import { StaffAvatarUpload } from './StaffAvatarUpload';
import { ServicePhotoUpload } from './ServicePhotoUpload';
import type { StaffPhotoService } from './StaffPhotosModal';

const DAYS: { id: number; label: string }[] = [
    { id: 1, label: 'Понедельник' },
    { id: 2, label: 'Вторник' },
    { id: 3, label: 'Среда' },
    { id: 4, label: 'Четверг' },
    { id: 5, label: 'Пятница' },
    { id: 6, label: 'Суббота' },
    { id: 0, label: 'Воскресенье' },
];

const DEFAULT_DAY = (dayOfWeek: number): StaffAvailabilityDay => ({
    dayOfWeek,
    isWorking: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: '10:00',
    endTime: '18:00',
});

type Tab = 'profile' | 'schedule' | 'portfolio';

interface StaffManagementHubProps {
    staff: {
        id: string;
        name: string;
        specialty?: string | null;
        bio?: string | null;
        avatarUrl?: string | null;
        experience?: string | null;
        rating?: number | null;
        tags?: string[] | null;
    };
    services: StaffPhotoService[];
    onClose: () => void;
}

export function StaffManagementHub({ staff, services, onClose }: StaffManagementHubProps) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div 
                className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900">
                            Управление: {staff.name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs Hub */}
                <div className="flex px-6 border-b border-stone-100 bg-white shrink-0">
                    <button
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-amber-400 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Профиль
                    </button>
                    <button
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'schedule' ? 'border-amber-400 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        Расписание
                    </button>
                    <button
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'portfolio' ? 'border-amber-400 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                        onClick={() => setActiveTab('portfolio')}
                    >
                        Работы
                    </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto bg-stone-50 relative min-h-[400px]">
                    <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                        <HubProfileTab staff={staff} onClose={onClose} />
                    </div>
                    <div className={activeTab === 'schedule' ? 'block' : 'hidden'}>
                        <HubScheduleTab staff={staff} onClose={onClose} />
                    </div>
                    <div className={activeTab === 'portfolio' ? 'block' : 'hidden'}>
                        <HubPortfolioTab staff={staff} services={services} onClose={onClose} />
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 z-[-1]" onClick={onClose} />
        </div>
    );
}

function HubProfileTab({ staff, onClose }: { staff: StaffManagementHubProps['staff'], onClose: () => void }) {
    const [name, setName] = useState(staff.name || '');
    const [specialty, setSpecialty] = useState(staff.specialty || '');
    const [bio, setBio] = useState(staff.bio || '');
    const [experience, setExperience] = useState(staff.experience || '');
    const [rating, setRating] = useState<string>(
        staff.rating !== null && staff.rating !== undefined ? String(staff.rating) : '5.0'
    );
    const [tagsInput, setTagsInput] = useState((staff.tags || []).join(', '));
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Имя не может быть пустым');
            return;
        }

        const parsedRating = Number(rating);
        if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            toast.error('Рейтинг должен быть числом от 0 до 5');
            return;
        }

        const parsedTags = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

        setIsSaving(true);
        const res = await updateStaffProfile(staff.id, {
            name,
            specialty,
            bio,
            experience,
            rating: parsedRating,
            tags: parsedTags,
        });

        setIsSaving(false);

        if (res.success) {
            toast.success('Профиль успешно обновлён');
            onClose();
        } else {
            toast.error(res.error || 'Ошибка при сохранении');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-6">
                <div className="flex justify-center pb-2">
                    <StaffAvatarUpload 
                        staffId={staff.id} 
                        staffName={staff.name} 
                        currentImageUrl={staff.avatarUrl || null} 
                    />
                </div>

                <div className="space-y-4 max-w-lg mx-auto w-full">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-600">Имя мастера <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                            placeholder="Например: Анна"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-600">Специализация (Должность)</label>
                        <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            className="w-full rounded-xl border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                            placeholder="Например: Бровист, Колорист"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-600">Описание (Био)</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:ring-amber-400 focus:outline-none resize-none"
                            placeholder="Краткая информация о мастере..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-stone-600">Опыт работы</label>
                            <input
                                type="text"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                className="w-full rounded-xl border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                                placeholder="Например: 5 лет опыта"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-stone-600">Рейтинг (0–5)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                className="w-full rounded-xl border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                                placeholder="5.0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-600">Специализация (Теги)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full rounded-xl border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                            placeholder="Ламинирование, Архитектура, Коррекция"
                        />
                        <p className="mt-1 text-[11px] text-stone-400">Перечислите через запятую. Максимум 12.</p>
                    </div>
                </div>
            </div>
            {/* Action Bar */}
            <div className="mt-auto border-t border-stone-100 bg-white px-6 py-4 flex gap-3 justify-end items-center sticky bottom-0">
                <Button variant="ghost" onClick={onClose} disabled={isSaving} className="text-stone-500 hover:text-stone-700">Отмена</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-400 text-stone-900 hover:bg-amber-500 px-6 font-medium gap-2 shadow-sm rounded-full">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Сохранить
                </Button>
            </div>
        </div>
    );
}

function HubScheduleTab({ staff, onClose }: { staff: StaffManagementHubProps['staff'], onClose: () => void }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [days, setDays] = useState<Record<number, StaffAvailabilityDay>>(() => {
        const map: Record<number, StaffAvailabilityDay> = {};
        for (const d of DAYS) map[d.id] = DEFAULT_DAY(d.id);
        return map;
    });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await getStaffAvailability(staff.id);
            if (cancelled) return;
            if (res.success && res.availability.length > 0) {
                setDays((prev) => {
                    const next = { ...prev };
                    for (const row of res.availability) next[row.dayOfWeek] = { ...row };
                    return next;
                });
            } else if (!res.success) {
                toast.error(res.error || 'Не удалось загрузить расписание');
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [staff.id]);

    const updateDay = (id: number, patch: Partial<StaffAvailabilityDay>) =>
        setDays((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    const handleSave = async () => {
        const payload = DAYS.map((d) => days[d.id]);
        for (const d of payload) {
            if (d.isWorking && d.startTime >= d.endTime) {
                toast.error(`Проверьте время: ${DAYS.find((x) => x.id === d.dayOfWeek)?.label}`);
                return;
            }
        }

        setSaving(true);
        const res = await updateStaffAvailability(staff.id, payload);
        setSaving(false);

        if (res.success) {
            toast.success('Расписание сохранено');
            onClose();
        } else {
            toast.error(res.error || 'Не удалось сохранить');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 h-full">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 space-y-3">
                <p className="text-xs text-stone-500 mb-4 px-1">Индивидуальные рабочие часы мастера имеют приоритет над основным расписанием салона.</p>
                {DAYS.map((day) => {
                    const value = days[day.id];
                    const disabled = !value.isWorking;
                    return (
                        <div key={day.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3">
                            <label className="flex min-w-[140px] cursor-pointer items-center gap-3 text-sm text-slate-800 font-medium">
                                <input
                                    type="checkbox"
                                    checked={value.isWorking}
                                    onChange={(e) => updateDay(day.id, { isWorking: e.target.checked })}
                                    className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                                />
                                <span>{day.label}</span>
                            </label>

                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <input
                                    type="time"
                                    value={value.startTime}
                                    disabled={disabled}
                                    onChange={(e) => updateDay(day.id, { startTime: e.target.value })}
                                    className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm text-slate-900 disabled:bg-stone-50 disabled:text-stone-400 focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                                />
                                <span>—</span>
                                <input
                                    type="time"
                                    value={value.endTime}
                                    disabled={disabled}
                                    onChange={(e) => updateDay(day.id, { endTime: e.target.value })}
                                    className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm text-slate-900 disabled:bg-stone-50 disabled:text-stone-400 focus:border-amber-400 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>

                            {!value.isWorking && <span className="text-[11px] text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded">Выходной</span>}
                        </div>
                    );
                })}
            </div>
            <div className="mt-auto border-t border-stone-100 bg-white px-6 py-4 flex gap-3 justify-end items-center sticky bottom-0">
                <Button variant="ghost" onClick={onClose} disabled={saving} className="text-stone-500 hover:text-stone-700">Отмена</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-amber-400 text-stone-900 hover:bg-amber-500 px-6 font-medium gap-2 shadow-sm rounded-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Сохранить
                </Button>
            </div>
        </div>
    );
}

function HubPortfolioTab({ staff, services, onClose }: { staff: StaffManagementHubProps['staff'], services: StaffManagementHubProps['services'], onClose: () => void }) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
        <div className="p-6">
            {services.length === 0 ? (
                <div className="py-12 bg-white rounded-2xl border border-dashed border-stone-200 text-center flex flex-col items-center justify-center p-6">
                    <p className="text-sm text-stone-500 max-w-md">В салоне пока нет услуг. Фотографии мастеров прикрепляются к конкретной услуге (например, "Окрашивание корней").</p>
                    <Link
                        href="/dashboard?section=services"
                        onClick={onClose}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить услугу
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-stone-500 mb-2 px-1">Выберите услугу, чтобы добавить или удалить фотографии работ этого мастера.</p>
                    {services.map((s) => {
                        const staffPhotos = s.portfolioPhotos.filter((p) => p.staffId === staff.id);
                        const expanded = expandedId === s.id;
                        return (
                            <div key={s.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden transition-all">
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(expanded ? null : s.id)}
                                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
                                    aria-expanded={expanded}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        {expanded ? <ChevronDown className="h-5 w-5 text-amber-500" /> : <ChevronRight className="h-5 w-5 text-stone-400" />}
                                        <span className="truncate text-[15px] font-bold text-stone-900">{s.title}</span>
                                    </span>
                                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                                        {staffPhotos.length} {staffPhotos.length === 1 ? 'фото' : 'фото'}
                                    </span>
                                </button>
                                {expanded && (
                                    <div className="border-t border-stone-100 bg-stone-50/50 p-5">
                                        <ServicePhotoUpload
                                            serviceId={s.id}
                                            staffId={staff.id}
                                            initialPhotos={staffPhotos}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
