'use client';

import { Button } from '@/components/ui/button';
import {
    ShieldCheck, ChevronRight, TrendingUp, Layout,
    Wallet, Images, Camera, MapPin, Info, Briefcase, Video, Pencil
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Helper for the grid cards
interface StatusCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle: string;
    badge?: string;
}

function StatusCard({ icon, iconBg, title, subtitle, badge }: StatusCardProps) {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
                <div className={`${iconBg} p-2 rounded-full`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-base text-gray-900">{title}</h3>
                        {badge && (
                            <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{badge}</span>
                        )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}

export function PassportVerificationCard({ status = 'IDLE' }: { status?: string }) {
    const t = useTranslations('dashboard.provider.dashboardCards.passport');

    if (status === 'PENDING') {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-6 shadow-sm mb-6">
                <div className="bg-yellow-50 p-3 rounded-full flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-lg mb-1 text-yellow-700">
                        {t('pendingTitle')}
                    </h3>
                    <p className="text-gray-500 text-xs md:text-sm">
                        {t('pendingBody')}
                    </p>
                </div>
            </div>
        )
    }

    if (status === 'APPROVED') {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-6 shadow-sm mb-6">
                <div className="bg-green-50 p-3 rounded-full flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-lg mb-1 text-green-700">
                        {t('approvedTitle')}
                    </h3>
                    <p className="text-gray-500 text-xs md:text-sm">
                        {t('approvedBody')}
                    </p>
                </div>
            </div>
        )
    }

    // IDLE or REJECTED
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-6 shadow-sm mb-6">
            <div className="bg-red-50 p-3 rounded-full flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-lg mb-1 flex items-center justify-center md:justify-start gap-2">
                    <span className="text-red-500 font-bold">!</span>
                    {status === 'REJECTED' ? t('rejectedTitle') : t('idleTitle')}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm">
                    {status === 'REJECTED'
                        ? t('rejectedBody')
                        : t('idleBody')}
                </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <Link href="/provider/verification">
                    <Button variant="secondary" className="w-full md:w-auto bg-gray-100 hover:bg-gray-200 text-black border-none font-medium h-10 px-6">
                        {t('verify')}
                    </Button>
                </Link>
                <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        </div>
    );
}

export function ServicePublicationCard() {
    const t = useTranslations('dashboard.provider.dashboardCards.publication');

    return (
        <div className="bg-[#0044BB] text-white p-6 rounded-2xl shadow-lg mb-6 overflow-hidden relative">
            <div className="relative z-10">
                <h3 className="font-bold text-xl mb-2">{t('title')}</h3>
                <p className="text-white/80 text-sm mb-6 max-w-xl">
                    {t('body')}
                </p>
                <Link href="/provider/services/new">
                    <Button className="bg-[#4477EE] hover:bg-[#3366DD] text-white border-none font-medium px-8 h-10 rounded-md">
                        {t('addServices')}
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export function PublicProfileCard() {
    const t = useTranslations('dashboard.provider.dashboardCards.publicProfile');

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
            <div className="flex items-center gap-3">
                <div className="text-gray-300">
                    <Layout className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-400 text-base">{t('title')}</h3>
                    <p className="text-gray-400 text-xs">{t('unavailable')}</p>
                </div>
            </div>
        </div>
    );
}

interface ProfileStatsGridProps {
    hasPhoto: boolean;
    hasAddress: boolean;
    bioLength: number;
    specialtiesCount: number;
}

export function ProfileStatsGrid({ hasPhoto, hasAddress, bioLength, specialtiesCount }: ProfileStatsGridProps) {
    const t = useTranslations('dashboard.provider.dashboardCards.stats');

    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div id="photo" className="h-full">
                <StatusCard
                    icon={<Camera className="w-5 h-5 text-blue-600" />}
                    iconBg="bg-blue-100"
                    title={t('photoTitle')}
                    subtitle={hasPhoto ? t('photoAdded') : t('photoMissing')}
                    badge={hasPhoto ? "OK" : undefined}
                />
            </div>
            <div id="address" className="h-full">
                <StatusCard
                    icon={<MapPin className="w-5 h-5 text-fuchsia-600" />}
                    iconBg="bg-fuchsia-100"
                    title={t('addressTitle')}
                    subtitle={hasAddress ? t('addressAdded') : t('addressMissing')}
                    badge={hasAddress ? "OK" : undefined}
                />
            </div>
            <div id="about" className="h-full">
                <StatusCard
                    icon={<Info className="w-5 h-5 text-orange-600" />}
                    iconBg="bg-orange-100"
                    title={t('bioTitle')}
                    subtitle={bioLength > 0 ? t('bioFilled', { count: bioLength }) : t('bioMissing')}
                    badge={bioLength > 20 ? "OK" : undefined}
                />
            </div>
            <div id="specialties" className="h-full">
                <StatusCard
                    icon={<Briefcase className="w-5 h-5 text-cyan-600" />}
                    iconBg="bg-cyan-100"
                    title={t('specialtiesTitle')}
                    subtitle={t('specialtiesAdded', { count: specialtiesCount })}
                    badge={specialtiesCount > 0 ? "OK" : undefined}
                />
            </div>
        </div>
    );
}

export interface ServiceItem {
    id: number; // Changed from string to number
    title: string;
    description: string | null; // Changed from string to string | null
    price: any; // Decimal
    // category removed as it's not on DirectoryService directly, or handled differently
    categoryName?: string; // We'll pass this manually
    status?: string;
}

export function ServicesList({ services = [] }: { services?: ServiceItem[] }) {
    const t = useTranslations('dashboard.provider.dashboardCards.services');

    if (services.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h3 className="font-bold text-xl">{t('title')}</h3>
                        <p className="text-gray-500 text-sm mt-1">{t('emptyBody')}</p>
                    </div>
                    <Link href="/provider/services/new">
                        <Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-black border-none h-10 px-4 flex items-center gap-2">
                            <span>+</span> {t('addService')}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">{t('title')}</h3>
                <Link href="/provider/services/new">
                    <Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-black border-none h-10 px-4 flex items-center gap-2">
                        <span>+</span> {t('add')}
                    </Button>
                </Link>
            </div>

            <div className="space-y-4">
                {services.map((service) => (
                    <div key={service.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors relative group">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {service.categoryName || t('uncategorized')}
                                </span>
                                {service.status === 'PENDING' && (
                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{t('pending')}</span>
                                )}
                                {service.status === 'APPROVED' && (
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{t('active')}</span>
                                )}
                            </div>
                            <Link href={`/services/${service.id}`} className="block after:absolute after:inset-0">
                                <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {service.title}
                                </h4>
                            </Link>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-md">{service.description || t('noDescription')}</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
                            <span className="font-bold text-lg">{Number(service.price).toFixed(2)} €</span>
                            <Link href={`/provider/services/edit/${service.id}`} className="relative z-10">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AddSpecialtyButton() {
    const t = useTranslations('dashboard.provider.dashboardCards.specialties');

    return (
        <Button variant="secondary" className="w-full bg-gray-100 hover:bg-gray-200 text-black border-none h-12 rounded-xl mt-6 font-medium flex items-center justify-center gap-2 text-base">
            <span>+</span> {t('add')}
        </Button>
    )
}
