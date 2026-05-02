import Link from 'next/link';
import {
    ShieldAlert, Users, Briefcase, Activity,
    CalendarCheck, CalendarDays, CalendarX, ShieldCheck,
    BookOpen
} from 'lucide-react';
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
import { AdminMigrationButton } from './components/AdminMigrationButton';
import AdminUsersTable from './components/AdminUsersTable';
import AdminServicesTable from './components/AdminServicesTable';
import AdminBookingsTable from './components/AdminBookingsTable';
import AdminStatCard from './components/AdminStatCard';
import { SystemStatus } from '@/components/admin/SystemStatus';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const t = await getTranslations('dashboard.admin');
    const session = await auth();
    const hasAccess = session?.user?.role === 'ADMIN';

    if (!hasAccess) {
        if (!session?.user) {
            redirect('/auth/login');
        }
        return (
            <section className="min-h-screen px-4 py-10">
                <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
                    <div className="bg-gray-950 px-6 py-5 text-white">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="h-6 w-6 text-red-400" />
                            <h1 className="text-xl font-bold tracking-tight">{t('access.title')}</h1>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                            <ShieldAlert className="h-7 w-7 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{t('access.denied')}</h2>
                        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
                            {t('access.body')}
                        </p>
                        <Button asChild variant="outline" className="mt-6">
                            <Link href="/">{t('access.home')}</Link>
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    const {
        totalUsers,
        totalServices,
        activeProviders,
        totalBookings,
        completedBookings,
        canceledBookings,
        users,
        services,
        bookings
    } = await getAdminData();

    return (
        <section className="min-h-screen pb-12">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 shadow-2xl">
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
                {/* Glow accent */}
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-12 left-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

                <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-8 sm:px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 shadow-lg">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                                Control Center
                            </p>
                            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                {t('title')}
                            </h1>
                        </div>
                    </div>

                    {/* Live System Health */}
                    <div className="hidden sm:flex items-center">
                        <SystemStatus />
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-7xl space-y-5 px-4 sm:px-6">

                {/* ── First Row: User / Service / Provider metrics ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <AdminStatCard
                        label="Total Users"
                        value={totalUsers}
                        icon={Users}
                        iconColor="text-blue-600"
                        iconBg="bg-blue-50"
                        borderColor="#2563eb"
                    />
                    <AdminStatCard
                        label="Total Services"
                        value={totalServices}
                        icon={Briefcase}
                        iconColor="text-emerald-600"
                        iconBg="bg-emerald-50"
                        borderColor="#059669"
                    />
                    <AdminStatCard
                        label="Active Providers"
                        value={activeProviders}
                        icon={Activity}
                        iconColor="text-purple-600"
                        iconBg="bg-purple-50"
                        borderColor="#9333ea"
                    />
                </div>

                {/* ── Second Row: Booking metrics ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <AdminStatCard
                        label={t('metrics.totalBookings')}
                        value={totalBookings}
                        icon={CalendarDays}
                        iconColor="text-orange-600"
                        iconBg="bg-orange-50"
                        borderColor="#ea580c"
                    />
                    <AdminStatCard
                        label={t('metrics.completed')}
                        value={completedBookings}
                        icon={CalendarCheck}
                        iconColor="text-green-600"
                        iconBg="bg-green-50"
                        borderColor="#16a34a"
                    />
                    <AdminStatCard
                        label={t('metrics.cancelled')}
                        value={canceledBookings}
                        icon={CalendarX}
                        iconColor="text-red-500"
                        iconBg="bg-red-50"
                        borderColor="#ef4444"
                    />
                </div>

                {/* ── Developer Tools ── */}
                <AdminMigrationButton />

                {/* ── Main Content Tabs ── */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <Tabs defaultValue="users" className="w-full">
                        {/* Tab Header */}
                        <div className="border-b border-gray-100 bg-gray-50/70 px-6 pt-5 pb-0">
                            <TabsList className="h-auto bg-transparent p-0 gap-1">
                                <TabsTrigger
                                    value="users"
                                    className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm font-medium text-gray-500 transition-all data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                                >
                                    <Users className="mr-2 h-4 w-4 inline-block" />
                                    {t('tabs.users')}
                                    <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                                        {totalUsers}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="services"
                                    className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm font-medium text-gray-500 transition-all data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                                >
                                    <Briefcase className="mr-2 h-4 w-4 inline-block" />
                                    {t('tabs.services')}
                                    <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                                        {totalServices}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="bookings"
                                    className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-1 text-sm font-medium text-gray-500 transition-all data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                                >
                                    <BookOpen className="mr-2 h-4 w-4 inline-block" />
                                    {t('tabs.bookings')}
                                    <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                                        {totalBookings}
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Content */}
                        <div className="p-0 sm:p-5">
                            <TabsContent value="users" className="mt-0 outline-none">
                                <AdminUsersTable users={users} />
                            </TabsContent>
                            <TabsContent value="services" className="mt-0 outline-none">
                                <AdminServicesTable services={services} />
                            </TabsContent>
                            <TabsContent value="bookings" className="mt-0 outline-none">
                                <AdminBookingsTable bookings={bookings} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </section>
    );
}
