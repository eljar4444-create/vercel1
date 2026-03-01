'use client';

import { useState } from 'react';
import { Trash2, Loader2, Clock, Euro } from 'lucide-react';
import { deleteService } from '@/app/actions/services';
import toast from 'react-hot-toast';

interface ServiceData {
    id: number;
    title: string;
    description?: string | null;
    images?: string[];
    price: string;
    duration_min: number;
}

interface ServiceListProps {
    services: ServiceData[];
}

export function ServiceList({ services }: ServiceListProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (serviceId: number) => {
        setDeletingId(serviceId);
        const result = await deleteService(serviceId);
        if (result.success) {
            toast.success('Услуга удалена');
        } else {
            toast.error(result.error || 'Не удалось удалить услугу');
        }
        setDeletingId(null);
    };

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
                <div key={service.id} className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{service.title}</h4>
                        {service.description ? (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{service.description}</p>
                        ) : null}
                        {service.images && service.images.length > 0 ? (
                            <div className="mt-2 flex gap-1.5">
                                {service.images.slice(0, 3).map((image, index) => (
                                    <img
                                        key={`${service.id}-preview-${index}`}
                                        src={image}
                                        alt={`${service.title} preview ${index + 1}`}
                                        className="h-10 w-10 rounded-md object-cover border border-gray-200"
                                    />
                                ))}
                            </div>
                        ) : null}
                        <div className="mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Euro className="w-3 h-3" />
                                {Number(service.price) === 0 ? 'по договорённости' : `${Number(service.price).toFixed(0)} €`}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {service.duration_min === 0 ? 'по договорённости' : `${service.duration_min} мин`}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-100"
                    >
                        {deletingId === service.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}
