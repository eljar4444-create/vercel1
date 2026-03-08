"use client";

import { useTransition } from "react";
import { User } from "@prisma/client";
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
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function AdminUsersTable({ users }: { users: User[] }) {
    const [isPending, startTransition] = useTransition();

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
                                <TableRow key={user.id} className="hover:bg-gray-50/80 transition-colors">
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
        </div>
    );
}
