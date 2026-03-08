"use client";

import { useTransition } from "react";
import { Service, Profile } from "@prisma/client";
import { deleteService } from "../actions";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type ServiceWithProfile = Service & { profile: Profile | null };

export default function AdminServicesTable({ services }: { services: ServiceWithProfile[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (serviceId: number) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту услугу? Это действие нельзя отменить.")) {
            return;
        }

        startTransition(() => {
            deleteService(serviceId);
        });
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="font-semibold text-gray-700">Название услуги</TableHead>
                            <TableHead className="font-semibold text-gray-700">Мастер / Салон</TableHead>
                            <TableHead className="font-semibold text-gray-700">Цена</TableHead>
                            <TableHead className="font-semibold text-gray-700">Длительность</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                                    Нет услуг
                                </TableCell>
                            </TableRow>
                        ) : (
                            services.map((service) => (
                                <TableRow key={service.id} className="hover:bg-gray-50/80 transition-colors">
                                    <TableCell className="font-medium text-gray-900">{service.title}</TableCell>
                                    <TableCell>
                                        {service.profile ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{service.profile.name}</span>
                                                <span className="text-xs text-gray-500">{service.profile.city}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Профиль удален</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                            {Number(service.price)} €
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {service.duration_min} мин.
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={() => handleDelete(service.id)}
                                            disabled={isPending}
                                            variant="outline"
                                            size="sm"
                                            className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                        >
                                            Удалить
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
