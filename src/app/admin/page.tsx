import Link from 'next/link';
import { ShieldAlert, ShieldCheck, Users, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { approveMaster, rejectMaster } from './actions';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export default async function AdminPage() {
    const session = await auth();
    const hasAccess = session?.user?.role === 'ADMIN';

    if (!hasAccess) {
        if (!session?.user) {
            redirect('/auth/login');
        }
        return (
            <section className="min-h-screen bg-gray-100 px-4 py-10">
                <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
                    <div className="bg-gray-950 px-6 py-5 text-white">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="h-6 w-6 text-red-400" />
                            <h1 className="text-xl font-bold tracking-tight">Админ-центр</h1>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                            <ShieldAlert className="h-7 w-7 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Доступ запрещен</h2>
                        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
                            У вашей учетной записи нет прав администратора.
                        </p>
                        <Button asChild variant="outline" className="mt-6">
                            <Link href="/">На главную</Link>
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    const pendingProfiles = await prisma.profile.findMany({
        where: { is_verified: false },
        select: {
            id: true,
            name: true,
            user_email: true,
            city: true,
            created_at: true,
            category: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: { created_at: 'desc' },
    });

    const pendingCount = pendingProfiles.length;

    return (
        <section className="min-h-screen bg-gray-100 pb-12">
            <div className="border-b border-gray-700 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 shadow-xl">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Control Center</p>
                        <h1 className="mt-1 text-2xl font-extrabold text-white">Заявки мастеров на модерации</h1>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                        <p className="text-xs text-gray-300">Новых заявок</p>
                        <p className="text-3xl font-black text-[#fc0]">{pendingCount}</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-7xl space-y-6 px-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-amber-50 p-2">
                                <Clock3 className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ожидают модерации</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-green-50 p-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Одобрено</p>
                                <p className="text-lg font-semibold text-gray-700">Через кнопку "Одобрить"</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-red-50 p-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Отклонено</p>
                                <p className="text-lg font-semibold text-gray-700">Удаляется навсегда</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-gray-100 p-2">
                                <Users className="h-5 w-5 text-gray-700" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Новые анкеты специалистов</h2>
                                <p className="text-sm text-gray-500">
                                    Проверьте данные и примите решение по каждой заявке.
                                </p>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            <ShieldCheck className="h-4 w-4" />
                            Отклонение удаляет профиль и связанные данные без возможности восстановления
                        </div>
                    </div>

                    {pendingCount === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                                <CheckCircle2 className="h-7 w-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Новых заявок нет</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Очередь чистая. Можно выпить кофе и вернуться позже.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Имя / салон</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Город</TableHead>
                                    <TableHead>Категория</TableHead>
                                    <TableHead>Дата заявки</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingProfiles.map((profile) => (
                                    <TableRow key={profile.id} className="hover:bg-gray-50/80">
                                        <TableCell className="font-semibold text-gray-900">{profile.name}</TableCell>
                                        <TableCell>
                                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                                                {profile.user_email}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                {profile.city}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                                {profile.category?.name ?? 'Без категории'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {formatDateTime(profile.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <form action={approveMaster}>
                                                    <input type="hidden" name="profile_id" value={profile.id} />
                                                    <Button
                                                        type="submit"
                                                        className="h-9 bg-green-600 text-white hover:bg-green-700"
                                                    >
                                                        ✅ Одобрить
                                                    </Button>
                                                </form>
                                                <form action={rejectMaster}>
                                                    <input type="hidden" name="profile_id" value={profile.id} />
                                                    <Button type="submit" variant="destructive" className="h-9">
                                                        ❌ Отклонить
                                                    </Button>
                                                </form>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </section>
    );
}
