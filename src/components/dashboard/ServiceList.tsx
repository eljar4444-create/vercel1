'use client';

import { Camera, Clock, Euro, Loader2, Pencil, Trash2 } from 'lucide-react';
import { ServicePhotoUpload, type ServicePhoto } from '@/components/dashboard/ServicePhotoUpload';

export interface ServiceData {
    id: number;
    title: string;
    description?: string | null;
    images?: string[];
    price: string;
    duration_min: number;
    portfolioPhotos?: ServicePhoto[];
}

interface ServiceListProps {
    services: ServiceData[];
    deletingId: number | null;
    onDelete: (serviceId: number) => void;
    onEdit: (service: ServiceData) => void;
    showPhotoUpload?: boolean;
}

export function ServiceList({ services, deletingId, onDelete, onEdit, showPhotoUpload = false }: ServiceListProps) {
    if (services.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-gray-400">Услуги пока не добавлены</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 py-2">
            {services.map((service) => (
                <div key={service.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        {service.images?.[0] ? (
                            <img
                                src={service.images[0]}
                                alt={service.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Camera className="h-5 w-5 text-gray-400" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h4 className="truncate text-sm font-medium text-gray-900">{service.title}</h4>
                                {service.description ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{service.description}</p>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-400">Добавьте описание в карточку услуги</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onEdit(service)}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Изменить
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(service.id)}
                                    disabled={deletingId === service.id}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
                                    aria-label="Удалить услугу"
                                >
                                    {deletingId === service.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Euro className="w-3 h-3" />
                                {Number(service.price) === 0 ? 'по договорённости' : `${Number(service.price).toFixed(0)} €`}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {service.duration_min === 0 ? 'по договорённости' : `${service.duration_min} мин`}
                            </span>
                        </div>

                        {showPhotoUpload && (
                            <ServicePhotoUpload
                                serviceId={service.id}
                                initialPhotos={service.portfolioPhotos ?? []}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
