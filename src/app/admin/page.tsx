import Link from 'next/link';
import { ShieldAlert, Users, Briefcase, Activity } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminData } from './actions';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AdminUsersTable from './components/AdminUsersTable';
import AdminServicesTable from './components/AdminServicesTable';

export const dynamic = 'force-dynamic';

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

    const { totalUsers, totalServices, activeProviders, users, services } = await getAdminData();

    return (
        <section className="min-h-screen bg-gray-100 pb-12">
            <div className="border-b border-gray-700 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 shadow-xl">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Control Center</p>
                        <h1 className="mt-1 text-2xl font-extrabold text-white">Панель администратора</h1>
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-7xl space-y-6 px-4">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-50 p-2">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-50 p-2">
                                <Briefcase className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Services</p>
                                <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-purple-50 p-2">
                                <Activity className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active Providers</p>
                                <p className="text-2xl font-bold text-gray-900">{activeProviders}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden text-black z-0 relative">
                    <Tabs defaultValue="users" className="w-full">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                                <TabsTrigger value="users">Пользователи</TabsTrigger>
                                <TabsTrigger value="services">Услуги</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-0 sm:p-6">
                            <TabsContent value="users" className="mt-0 outline-none">
                                <AdminUsersTable users={users} />
                            </TabsContent>

                            <TabsContent value="services" className="mt-0 outline-none">
                                <AdminServicesTable services={services} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </section>
    );
}
