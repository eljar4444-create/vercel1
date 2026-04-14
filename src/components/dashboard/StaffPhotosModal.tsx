'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { ServicePhotoUpload, type ServicePhoto } from '@/components/dashboard/ServicePhotoUpload';

export interface StaffPhotoService {
    id: number;
    title: string;
    portfolioPhotos: ServicePhoto[];
}

interface StaffPhotosModalProps {
    staff: { id: string; name: string };
    services: StaffPhotoService[];
    onClose: () => void;
}

export function StaffPhotosModal({ staff, services, onClose }: StaffPhotosModalProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="text-base font-semibold text-slate-900">
                        Фотографии · {staff.name}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Закрыть"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto p-4">
                    {services.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">
                            Добавьте услуги, чтобы прикрепить к ним фотографии мастера.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {services.map((s) => {
                                const staffPhotos = s.portfolioPhotos.filter(
                                    (p) => p.staffId === staff.id
                                );
                                const expanded = expandedId === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        className="rounded-xl border border-gray-100 bg-white"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedId(expanded ? null : s.id)
                                            }
                                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                                            aria-expanded={expanded}
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                {expanded ? (
                                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                                )}
                                                <span className="truncate text-sm font-medium text-gray-900">
                                                    {s.title}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-xs text-gray-500">
                                                {staffPhotos.length}{' '}
                                                {staffPhotos.length === 1 ? 'фото' : 'фото'}
                                            </span>
                                        </button>

                                        {expanded && (
                                            <div className="border-t border-gray-100 px-3 pb-3">
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
            </div>
        </div>
    );
}
