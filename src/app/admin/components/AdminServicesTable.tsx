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
import { Briefcase, Clock, Trash2 } from "lucide-react";

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
        <div className="overflow-x-auto rounded-xl">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-100">
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Название услуги
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Мастер / Салон
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Цена
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Длительность
                        </TableHead>
                        <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                            Действия
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                                <Briefcase className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                                Нет услуг
                            </TableCell>
                        </TableRow>
                    ) : (
                        services.map((service) => (
                            <TableRow
                                key={service.id}
                                className="border-b border-gray-50 transition-colors hover:bg-gray-50/60"
                            >
                                <TableCell className="py-3.5">
                                    <span className="font-medium text-gray-900">{service.title}</span>
                                </TableCell>
                                <TableCell className="py-3.5">
                                    {service.profile ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold text-gray-800">
                                                {service.profile.name}
                                            </span>
                                            <span className="text-xs text-gray-400">{service.profile.city}</span>
                                        </div>
                                    ) : (
                                        <span className="italic text-gray-400 text-sm">Профиль удален</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-3.5">
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                        {Number(service.price)} €
                                    </span>
                                </TableCell>
                                <TableCell className="py-3.5">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                        <Clock className="h-3 w-3" />
                                        {service.duration_min} мин.
                                    </span>
                                </TableCell>
                                <TableCell className="py-3.5 text-right">
                                    <Button
                                        onClick={() => handleDelete(service.id)}
                                        disabled={isPending}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 border-gray-200 text-gray-600 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Удалить
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
