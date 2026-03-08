"use client";

import { useTransition, useState } from "react";
import { toggleUserBan } from "../actions";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ShieldAlert, ShieldCheck, Mail, Calendar, User as UserIcon } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

// We'll define a type that matches the payload from `getAdminData`
type AugmentedUser = any;

export default function AdminUsersTable({ users }: { users: AugmentedUser[] }) {
    const [isPending, startTransition] = useTransition();
    const [selectedUser, setSelectedUser] = useState<AugmentedUser | null>(null);

    const handleToggleBan = (userId: string, currentStatus: boolean) => {
        // Confirmation is optional for unbanning, but good for banning
        if (!currentStatus && !window.confirm("Вы уверены, что хотите заблокировать этого пользователя?")) {
            return;
        }

        startTransition(() => {
            toggleUserBan(userId, currentStatus);
        });
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="font-semibold text-gray-700">Имя</TableHead>
                            <TableHead className="font-semibold text-gray-700">Email</TableHead>
                            <TableHead className="font-semibold text-gray-700">Роль</TableHead>
                            <TableHead className="font-semibold text-gray-700">Статус</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                                    Нет пользователей
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <TableCell className="font-medium text-gray-900">{user.name || "Без имени"}</TableCell>
                                    <TableCell>
                                        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                                            {user.email || "Нет email"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {user.isBanned ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
                                                <ShieldAlert className="h-3 w-3" />
                                                Заблокирован
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200">
                                                <ShieldCheck className="h-3 w-3" />
                                                Активен
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={() => handleToggleBan(user.id, user.isBanned)}
                                            disabled={isPending || user.role === 'ADMIN'}
                                            variant={user.isBanned ? "destructive" : "outline"}
                                            size="sm"
                                            className={!user.isBanned ? "hover:bg-red-50 hover:text-red-700 hover:border-red-200" : ""}
                                        >
                                            {user.isBanned ? "Разблокировать" : "Заблокировать"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* User Dossier Sheet */}
            <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white" side="right">
                    <SheetHeader className="mb-6 space-y-1 mt-4">
                        <SheetTitle className="text-xl">Досье пользователя</SheetTitle>
                        <SheetDescription>
                            Детальная информация, статистика и управление доступом.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedUser && (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200 ring-offset-2 flex items-center justify-center">
                                    {selectedUser.image ? (
                                        <img src={selectedUser.image} alt="User Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-8 w-8 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 leading-none">
                                        {selectedUser.name || "Без имени"}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span>{selectedUser.email || "Нет email"}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Зарегистрирован: {new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Role and Ban status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Роль в системе</p>
                                    <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedUser.role}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Статус аккаунта</p>
                                    <div className="mt-1.5">
                                        {selectedUser.isBanned ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-red-600 text-sm">
                                                <ShieldAlert className="h-4 w-4" /> Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 font-semibold text-green-600 text-sm">
                                                <ShieldCheck className="h-4 w-4" /> Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Client Metrics */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Статистика Клиента</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                                        <p className="text-2xl font-bold text-blue-600">{selectedUser._count?.bookings || 0}</p>
                                        <p className="mt-1 text-xs text-gray-500 font-medium">Создано записей</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                                        <p className="text-2xl font-bold text-indigo-600">{selectedUser.profile ? "Да" : "Нет"}</p>
                                        <p className="mt-1 text-xs text-gray-500 font-medium">Профиль мастера</p>
                                    </div>
                                </div>
                            </div>

                            {/* Master Metrics (If they are a provider) */}
                            {selectedUser.profile && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Статистика Мастера</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                                            <p className="text-2xl font-bold text-amber-500">{selectedUser.profile._count?.services || 0}</p>
                                            <p className="mt-1 text-xs text-gray-500 font-medium">Активных услуг</p>
                                        </div>
                                        <div className="rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                                            <p className="text-2xl font-bold text-emerald-500">{selectedUser.profile._count?.bookings || 0}</p>
                                            <p className="mt-1 text-xs text-gray-500 font-medium">Полученных записей</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions block */}
                            <div className="pt-4 mt-6 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Действия администратора</h4>
                                <Button
                                    onClick={() => handleToggleBan(selectedUser.id, selectedUser.isBanned)}
                                    disabled={isPending || selectedUser.role === 'ADMIN'}
                                    variant={selectedUser.isBanned ? "destructive" : "outline"}
                                    className={`w-full ${!selectedUser.isBanned ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-200' : ''}`}
                                >
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    {selectedUser.isBanned ? "Снять блокировку аккаунта" : "Приостановить доступ (Soft Ban)"}
                                </Button>
                                {selectedUser.role === 'ADMIN' && (
                                    <p className="text-xs text-center text-gray-500 mt-2">Администраторов заблокировать нельзя</p>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
