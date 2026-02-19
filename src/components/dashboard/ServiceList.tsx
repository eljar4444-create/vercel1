'use client';

import { useState } from 'react';
import { Trash2, Loader2, Clock, Euro } from 'lucide-react';
import { deleteService } from '@/app/actions/services';
import toast from 'react-hot-toast';

interface ServiceData {
    id: number;
    title: string;
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
        <div className="divide-y divide-gray-100">
            {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between py-4 group">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{service.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Euro className="w-3 h-3" />
                                {Number(service.price).toFixed(0)} €
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {service.duration_min} мин
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-100"
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
