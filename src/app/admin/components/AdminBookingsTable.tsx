"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Calendar, Clock, DollarSign, BookOpen } from "lucide-react";

type AugmentedBooking = any;

function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { label: string; classes: string }> = {
        PENDING: { label: "Ожидает", classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
        CONFIRMED: { label: "Подтверждено", classes: "bg-blue-50 text-blue-700 border border-blue-200" },
        COMPLETED: { label: "Завершено", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
        CANCELED: { label: "Отменено", classes: "bg-red-50 text-red-700 border border-red-200" },
        NO_SHOW: { label: "Не пришёл", classes: "bg-slate-50 text-slate-600 border border-slate-200" },
    };

    const config = statusMap[status] || { label: status, classes: "bg-gray-50 text-gray-700 border border-gray-200" };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${config.classes}`}>
            {config.label}
        </span>
    );
}

export default function AdminBookingsTable({ bookings }: { bookings: AugmentedBooking[] }) {
    return (
        <div className="overflow-x-auto rounded-xl">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-100">
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Дата / Время
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Услуга
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Клиент
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Мастер
                        </TableHead>
                        <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                            Сумма
                        </TableHead>
                        <TableHead className="py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                            Статус
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bookings.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                                <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                                Нет записей
                            </TableCell>
                        </TableRow>
                    ) : (
                        bookings.map((booking) => {
                            const clientAvatar = booking.user?.image;
                            const clientName = booking.user_name || booking.user?.name || "Без имени";
                            const masterAvatar = booking.profile?.image_url || booking.profile?.user?.image;
                            const masterName = booking.profile?.name || "Без имени";

                            return (
                                <TableRow
                                    key={booking.id}
                                    className="border-b border-gray-50 hover:bg-gray-50/50"
                                >
                                    <TableCell className="py-3.5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                {format(new Date(booking.date), "dd MMM yyyy", { locale: ru })}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                {booking.time}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-3.5">
                                        <div className="font-medium text-gray-900 text-sm">
                                            {booking.service?.title || "Услуга удалена"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-3.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 border border-gray-200">
                                                <AvatarImage src={clientAvatar} />
                                                <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                                                    {getInitials(clientName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-gray-800">{clientName}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-3.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6 border border-gray-200">
                                                <AvatarImage src={masterAvatar} />
                                                <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px] font-bold">
                                                    {getInitials(masterName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-gray-800">{masterName}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-3.5">
                                        <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
                                            {booking.service?.price ? (
                                                <>
                                                    {Number(booking.service.price)}
                                                    <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                                </>
                                            ) : (
                                                <span className="text-xs font-normal text-gray-400">—</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-3.5 text-right">
                                        <StatusBadge status={booking.status} />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
