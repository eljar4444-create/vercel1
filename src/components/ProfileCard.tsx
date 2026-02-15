'use client';

import Link from 'next/link';
import { MapPin, Sparkles, Stethoscope, Globe, UserCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface ProfileCardProps {
    profile: {
        id: number;
        name: string;
        city: string;
        address?: string | null;
        image_url?: string | null;
        is_verified?: boolean;
        attributes?: any; // JSON — may contain { languages: ["RU", "DE"] } etc.
        category?: {
            slug: string;
            name: string;
        } | null;
        services?: {
            id: number;
            title: string;
            price: number | string;
            duration_min: number;
        }[];
    };
}

// ─── Category style map ──────────────────────────────────────────────
const CAT_STYLE: Record<string, {
    accent: string;
    accentBg: string;
    accentBorder: string;
    icon: React.ReactNode;
}> = {
    beauty: {
        accent: 'text-rose-600',
        accentBg: 'bg-rose-50',
        accentBorder: 'border-rose-100',
        icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    health: {
        accent: 'text-teal-600',
        accentBg: 'bg-teal-50',
        accentBorder: 'border-teal-100',
        icon: <Stethoscope className="w-3.5 h-3.5" />,
    },
};

// ─── Language flag helper ────────────────────────────────────────────
const LANG_FLAGS: Record<string, { flag: string; label: string }> = {
    RU: { flag: '🇷🇺', label: 'Русский' },
    DE: { flag: '🇩🇪', label: 'Deutsch' },
    EN: { flag: '🇬🇧', label: 'English' },
    UA: { flag: '🇺🇦', label: 'Українська' },
    TR: { flag: '🇹🇷', label: 'Türkçe' },
};

export function ProfileCard({ profile }: ProfileCardProps) {
    const catSlug = profile.category?.slug || '';
    const style = CAT_STYLE[catSlug] || CAT_STYLE.beauty;

    // Find cheapest service
    const services = profile.services || [];
    const cheapest = services.length > 0
        ? services.reduce((min, s) => Number(s.price) < Number(min.price) ? s : min, services[0])
        : null;

    // Extract languages from JSON attributes
    const attrs = profile.attributes || {};
    const languages: string[] = attrs.languages || attrs.sprachen || [];

    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
            {/* ── Top: Photo + Quick Info ── */}
            <div className="flex gap-0">
                {/* Photo */}
                <div className="w-32 sm:w-36 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {profile.image_url ? (
                        <img
                            src={profile.image_url}
                            alt={profile.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <UserCircle className="w-12 h-12 text-gray-300" />
                        </div>
                    )}
                    {/* Verified badge */}
                    {profile.is_verified && (
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-green-600 shadow-sm border border-green-100">
                            ✓ Проверен
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    {/* Name + Category */}
                    <div>
                        <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {profile.name}
                        </h3>

                        {/* Category Badge */}
                        {profile.category && (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 px-2 py-0.5 rounded-full ${style.accentBg} ${style.accent}`}>
                                {style.icon}
                                {profile.category.name}
                            </span>
                        )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{profile.city}{profile.address ? `, ${profile.address}` : ''}</span>
                    </div>

                    {/* Language Badges (for doctors / health) */}
                    {languages.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {languages.map((lang: string) => {
                                const info = LANG_FLAGS[lang.toUpperCase()];
                                if (!info) return null;
                                return (
                                    <span
                                        key={lang}
                                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs font-medium"
                                        title={info.label}
                                    >
                                        <span>{info.flag}</span>
                                        <span>{lang.toUpperCase()}</span>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Services list ── */}
            {services.length > 0 && (
                <div className="px-4 border-t border-gray-50">
                    {services.slice(0, 3).map((svc) => (
                        <div key={svc.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-700 truncate mr-3">{svc.title}</span>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-gray-400">{svc.duration_min} мин</span>
                                <span className="text-sm font-bold text-gray-900">€{Number(svc.price).toFixed(0)}</span>
                            </div>
                        </div>
                    ))}
                    {services.length > 3 && (
                        <p className="text-xs text-gray-400 py-2">
                            +{services.length - 3} услуг ещё
                        </p>
                    )}
                </div>
            )}

            {/* ── Bottom: Price + CTA ── */}
            <div className="mt-auto px-4 py-4 flex items-center justify-between gap-3 bg-gray-50/50">
                {/* Price "from" */}
                {cheapest && (
                    <div className="text-sm">
                        <span className="text-gray-500">от </span>
                        <span className="text-lg font-bold text-gray-900">€{Number(cheapest.price).toFixed(0)}</span>
                    </div>
                )}
                {!cheapest && <div />}

                {/* CTA */}
                <Link
                    href={`/profile/${profile.id}`}
                    className={`inline-flex items-center gap-1.5 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                        ${catSlug === 'health'
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-rose-500 hover:bg-rose-600 text-white'
                        }`}
                >
                    Записаться
                </Link>
            </div>
        </div>
    );
}
