'use client';

import { EntityHero } from '../EntityHero';
import { CraftWallGrid } from '../CraftWallGrid';
import { ServiceMenu } from '../ServiceMenu';
import { ReviewsSection } from '../ReviewsSection';
import { useRouter } from 'next/navigation';

export interface LayoutProfileData {
    id: number;
    slug: string;
    name: string;
    provider_type: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    city: string;
    image_url?: string | null;
    address?: string | null;
    bio?: string | null;
    outcallRadiusKm?: number | null;
    gallery: string[];
    studioImages: string[];
    services: any[];
    staff: any[];
    photos: any[]; // Aggregated from services for simple prop passing, or passed manually
    reviews: any[];
}

export function PrivateMasterLayout({ profile }: { profile: LayoutProfileData }) {
    const router = useRouter();

    // Determine the master's avatar. For Private, there's usually 1 staff or falling back to profile.
    const masterAvatar = profile.staff[0]?.avatarUrl || null;
    const masterSpecialty = profile.staff[0]?.specialty || null;

    // Aggregate photos for CraftWallGrid. Note: It accepts PortfolioPhoto model shape
    // Assuming we can pass all photos associated with this profile
    const allPhotos = profile.services.flatMap((s) =>
        s.photos.map((p: any) => ({
            id: p.id,
            url: p.url,
            serviceId: p.serviceId,
        }))
    );

    return (
        <div className="min-h-screen bg-booking-bg pb-24 sm:pb-32 selection:bg-booking-primary/30">
            {/* Screen 1: Hero & Craft Wall */}
            <EntityHero
                providerType="PRIVATE"
                name={profile.name}
                slug={profile.slug}
                avatarUrl={masterAvatar}
                bioOrDescription={profile.bio}
                city={profile.city}
                outcallRadiusKm={profile.outcallRadiusKm}
            />

            {allPhotos.length > 0 && (
                <div className="max-w-5xl mx-auto px-4 mt-2">
                    <CraftWallGrid shuffleSeed={profile.id} photos={allPhotos} />
                </div>
            )}

            {/* Screen 2: Services */}
            <div className="max-w-2xl mx-auto px-4 mt-12 mb-12">
                <ServiceMenu
                    services={profile.services.map((s) => ({
                        id: s.id,
                        title: s.title,
                        description: s.description,
                        price: Number(s.price),
                        duration_min: s.duration_min,
                        images: s.images,
                        photos: s.photos,
                    }))}
                    onBook={(service) => {
                        router.push(`/book/${profile.slug}?serviceId=${service.id}`);
                    }}
                />
            </div>

            {/* Screen 3: Reviews */}
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
