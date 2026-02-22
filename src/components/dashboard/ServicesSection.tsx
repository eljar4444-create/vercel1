'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ServiceList } from '@/components/dashboard/ServiceList';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';

interface ServiceData {
    id: number;
    title: string;
    description?: string | null;
    images?: string[];
    price: string;
    duration_min: number;
}

interface ServicesSectionProps {
    profileId: number;
    services: ServiceData[];
}

export function ServicesSection({ profileId, services }: ServicesSectionProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <>
            <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">Управляйте услугами и ценами в пару кликов.</p>
                    <button
                        type="button"
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить услугу
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white px-3 sm:px-4">
                    <ServiceList services={services} />
                </div>
            </div>

            {isAddOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <h3 className="text-base font-semibold text-slate-900">Новая услуга</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                aria-label="Закрыть"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="max-h-[80vh] overflow-y-auto p-4">
                            <AddServiceForm profileId={profileId} />
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
