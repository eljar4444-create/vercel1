'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { deleteService } from '@/app/actions/services';
import { ServiceList, type ServiceData } from '@/components/dashboard/ServiceList';
import { AddServiceForm, type StaffOption } from '@/components/dashboard/AddServiceForm';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface ServicesSectionProps {
    profileId: number;
    services: ServiceData[];
    staff?: StaffOption[];
}

export function ServicesSection({ profileId, services, staff = [] }: ServicesSectionProps) {
    const t = useTranslations('dashboard.provider.servicesUi');
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
            toast.success(t('updated'));
            return;
        }

        setIsAddOpen(false);
        toast.success(t('added'));
    };

    const handleDelete = async (serviceId: number) => {
        setDeletingId(serviceId);
        const result = await deleteService(serviceId);
        if (result.success) {
            setServiceItems((prev) => prev.filter((service) => service.id !== serviceId));
            toast.success(t('deleted'));
        } else {
            toast.error(result.error || t('deleteError'));
        }
        setDeletingId(null);
    };

    const renderModal = (mode: 'create' | 'edit') => {
        const isEdit = mode === 'edit';
        const currentService = editingService;

        return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
                <div className="w-full max-w-2xl rounded-md bg-[#F5F2ED] border border-gray-300">
                    <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
                        <h3 className="text-base font-semibold text-slate-900">
                            {isEdit ? t('editService') : t('newService')}
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-transparent text-slate-500 hover:border-gray-900 hover:text-slate-900"
                            aria-label={t('close')}
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
                                staffIds: currentService.staffIds,
                            } : undefined}
                            availableStaff={staff}
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
            <div className="space-y-4 bg-transparent">
                <div className="flex items-center justify-between gap-3 border-b border-gray-300 pb-4">
                    <p className="text-sm text-slate-500">{t('subtitle')}</p>
                    <button
                        type="button"
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        <Plus className="h-4 w-4" />
                        {t('addService')}
                    </button>
                </div>

                <div className="bg-transparent">
                    <ServiceList
                        services={serviceItems}
                        deletingId={deletingId}
                        onDelete={handleDelete}
                        onEdit={setEditingService}
                        showPhotoUpload
                    />
                </div>
            </div>

            {isAddOpen ? renderModal('create') : null}
            {editingService ? renderModal('edit') : null}
        </>
    );
}
