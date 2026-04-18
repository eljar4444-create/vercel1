'use client';

import { EntityHero } from '../EntityHero';
import { TeamSection } from '../TeamSection';
import { ServiceMenu } from '../ServiceMenu';
import { ReviewsSection } from '../ReviewsSection';
import { SpecialistSelector } from '../SpecialistSelector';
import type { LayoutProfileData } from './PrivateMasterLayout';
import type { SpecialistCardProps } from '../SpecialistCard';
import type { ServiceItem } from '../ServiceMenu';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

export function SalonLayout({ profile }: { profile: LayoutProfileData }) {
    const router = useRouter();
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    // Process specialists for TeamSection
    const specialists: SpecialistCardProps[] = profile.staff.map((staff) => {
        // Collect photos for THIS specific staff member across all services
        const staffPhotos = profile.services.flatMap((s) =>
            s.photos
                .filter((p: any) => p.staffId === staff.id)
                .map((p: any) => ({
                    id: p.id,
                    url: p.url,
                    serviceId: p.serviceId,
                    staffId: p.staffId,
                }))
        );

        return {
            id: staff.id,
            name: staff.name,
            avatarUrl: staff.avatarUrl,
            specialty: staff.specialty,
            rating: 5.0, // Should be fetched from API if we want true specialist ratings
            reviewCount: 0,
            photos: staffPhotos,
        };
    });

    return (
        <div className="min-h-screen bg-booking-bg pb-24 sm:pb-32 selection:bg-booking-primary/30">
            {/* Screen 1: Hero */}
            <div className="max-w-5xl mx-auto">
                <EntityHero
                    providerType="SALON"
                    name={profile.name}
                    slug={profile.slug}
                    avatarUrl={profile.image_url} // Use main profile image for Salon logo
                    bioOrDescription={profile.bio}
                    city={profile.city}
                    address={profile.address}
                    interiorPhotos={profile.studioImages}
                />
            </div>

            {/* Screen 2: TeamSection */}
            <div className="max-w-5xl mx-auto mt-4 px-2">
                <TeamSection specialists={specialists} />
            </div>

            {/* Screen 3: Services */}
            <div className="max-w-2xl mx-auto px-4 mt-8 mb-12">
                <ServiceMenu
                    services={profile.services.map((s) => ({
                        id: s.id,
                        title: s.title,
                        description: s.description,
                        price: Number(s.price),
                        duration_min: s.duration_min,
                        images: s.images,
                        photos: s.photos,
                        staff: profile.staff, // Usually filtered per service, but providing all here for simplicity
                    }))}
                    onBook={(service) => setSelectedService(service)}
                    showSpecialistNames={true}
                />
            </div>

            {/* Specialist Selector Modal */}
            <SpecialistSelector
                open={selectedService !== null}
                onClose={() => setSelectedService(null)}
                serviceTitle={selectedService?.title || ''}
                specialists={profile.staff.map(s => ({
                    id: s.id,
                    name: s.name,
                    avatarUrl: s.avatarUrl,
                    specialty: s.specialty,
                    rating: 5.0,
                }))}
                onSelect={(staffId) => {
                    const url = new URL(`${window.location.origin}/book/${profile.slug}`);
                    if (selectedService) url.searchParams.set('serviceId', String(selectedService.id));
                    if (staffId) url.searchParams.set('staffId', staffId);
                    router.push(url.pathname + url.search);
                }}
            />

            {/* Screen 4: Reviews */}
            <div className="max-w-2xl mx-auto px-4 mt-8">
                <ReviewsSection
                    reviews={profile.reviews.map((r) => ({
                        id: r.id,
                        comment: r.comment,
                        rating: r.rating,
                        createdAt: String(r.createdAt),
                        clientName: r.client?.name || 'Пользователь',
                    }))}
                />
            </div>
        </div>
    );
}
