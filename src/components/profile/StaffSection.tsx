'use client';

import Image from 'next/image';
import { Star, User } from 'lucide-react';
import { useState } from 'react';
import { StaffPortfolioModal, type StaffModalService } from './StaffPortfolioModal';

export interface Staff {
    id: string;
    name: string;
    avatarUrl?: string | null;
    specialty?: string | null;
    experience?: string | null;
    rating?: number | null;
    tags?: string[] | null;
    photos?: string[];
    isActive?: boolean;
}

export interface StaffSectionProps {
    staff: Staff[];
    salonSlug: string;
    services?: StaffModalService[];
}

export function StaffSection({ staff, salonSlug, services = [] }: StaffSectionProps) {
    const activeStaff = staff.filter((s) => s.isActive !== false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    if (activeStaff.length === 0) return null;

    return (
        <section className="flex h-full flex-col">
            <h2 className="text-xl font-semibold text-stone-800 mb-5">
                Специалисты
            </h2>

            <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-6">
                {activeStaff.map((member) => (
                    <ExpertCard key={member.id} member={member} onClick={() => setSelectedStaff(member)} />
                ))}
            </div>

            {selectedStaff && (
                <StaffPortfolioModal
                    staff={selectedStaff}
                    salonSlug={salonSlug}
                    services={services}
                    isOpen={!!selectedStaff}
                    onClose={() => setSelectedStaff(null)}
                />
            )}
        </section>
    );
}

function ExpertCard({ member, onClick }: { member: Staff; onClick: () => void }) {
    const rating = typeof member.rating === 'number' ? member.rating : null;
    const tags = (member.tags ?? []).slice(0, 4);

    return (
        <div
            onClick={onClick}
            className="group h-full flex flex-col items-center text-center bg-white rounded-2xl border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
        >
            <div className="relative h-24 w-24 mb-4 overflow-hidden rounded-full border border-gray-200">
                {member.avatarUrl ? (
                    <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400">
                        <User className="h-10 w-10" aria-hidden="true" />
                    </div>
                )}
            </div>

            <h3 className="text-base font-semibold text-gray-900 truncate w-full">
                {member.name}
            </h3>

            {(rating !== null || member.experience) && (
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                    {rating !== null && (
                        <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
                        </span>
                    )}
                    {rating !== null && member.experience ? <span className="text-gray-300">•</span> : null}
                    {member.experience && <span className="truncate">{member.experience}</span>}
                </div>
            )}

            {member.specialty ? (
                <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-gray-400 truncate w-full">
                    {member.specialty}
                </p>
            ) : null}

            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className="mt-auto pt-5 w-full"
            >
                <span className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-gray-50 border border-gray-200 px-4 text-xs font-medium tracking-wide text-gray-700 transition-colors duration-300 group-hover:bg-gray-100 active:scale-95">
                    Портфолио
                </span>
            </button>
        </div>
    );
}

