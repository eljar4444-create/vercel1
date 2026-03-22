'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { deleteService } from '@/app/actions/services';
import { ServiceList, type ServiceData } from '@/components/dashboard/ServiceList';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';
import toast from 'react-hot-toast';

interface ServicesSectionProps {
    profileId: number;
    services: ServiceData[];
}

export function ServicesSection({ profileId, services }: ServicesSectionProps) {
    const [serviceItems, setServiceItems] = useState(services);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceData | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const sortServices = (items: ServiceData[]) =>
        [...items].sort((a, b) => a.title.localeCompare(b.title, 'ru'));

    const handleServiceSaved = (service: ServiceData) => {
        setServiceItems((prev) => {
            const exists = prev.some((item) => item.id === service.id);
            return sortServices(exists ? prev.map((item) => (item.id === service.id ? service : item)) : [...prev, service]);
        });

        if (editingService) {
            setEditingService(null);
            toast.success('Услуга обновлена');
            return;
        }

        setIsAddOpen(false);
        toast.success('Услуга добавлена');
    };

    const handleDelete = async (serviceId: number) => {
        setDeletingId(serviceId);
        const result = await deleteService(serviceId);
        if (result.success) {
            setServiceItems((prev) => prev.filter((service) => service.id !== serviceId));
            toast.success('Услуга удалена');
        } else {
            toast.error(result.error || 'Не удалось удалить услугу');
        }
        setDeletingId(null);
    };

    const renderModal = (mode: 'create' | 'edit') => {
        const isEdit = mode === 'edit';
        const currentService = editingService;

        return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
                <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h3 className="text-base font-semibold text-slate-900">
                            {isEdit ? 'Изменить услугу' : 'Новая услуга'}
                        </h3>
                        <button
                            type="button"
                            onClick={() => {
                                if (isEdit) {
                                    setEditingService(null);
                                } else {
                                    setIsAddOpen(false);
                                }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Закрыть"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="max-h-[80vh] overflow-y-auto p-4">
                        <AddServiceForm
                            profileId={profileId}
                            serviceId={isEdit ? String(currentService?.id) : undefined}
                            initialData={isEdit && currentService ? {
                                id: currentService.id,
                                title: currentService.title,
                                description: currentService.description,
                                price: Number(currentService.price),
                                duration_min: currentService.duration_min,
                                images: currentService.images,
                            } : undefined}
                            compact
                            onSaved={handleServiceSaved}
                        />
                    </div>
                </div>
            </div>
        );
    };

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
                    <ServiceList
                        services={serviceItems}
                        deletingId={deletingId}
                        onDelete={handleDelete}
                        onEdit={setEditingService}
                    />
                </div>
            </div>

            {isAddOpen ? renderModal('create') : null}
            {editingService ? renderModal('edit') : null}
        </>
    );
}
