'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isBeautyServiceTitle } from '@/lib/constants/services-taxonomy';
import { requireProviderProfile } from '@/lib/auth-helpers';
import { DEFAULT_LOCALE } from '@/i18n/config';

function parseImages(rawImages: FormDataEntryValue | null): string[] {
    if (!rawImages || typeof rawImages !== 'string') return [];

    try {
        const parsed = JSON.parse(rawImages);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .slice(0, 10);
    } catch {
        return [];
    }
}

function parseStaffIds(raw: FormDataEntryValue | null): string[] {
    if (!raw || typeof raw !== 'string') return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .slice(0, 50);
    } catch {
        return [];
    }
}

async function filterOwnedStaffIds(profileId: number, staffIds: string[]): Promise<string[]> {
    if (staffIds.length === 0) return [];
    const rows = await prisma.staff.findMany({
        where: { profileId, id: { in: staffIds } },
        select: { id: true },
    });
    return rows.map((r) => r.id);
}

function serializeService(service: {
    id: number;
    title: string;
    description: string | null;
    images: string[];
    price: { toString(): string } | number | string;
    duration_min: number;
    staff?: { id: string }[];
}) {
    return {
        id: service.id,
        title: service.title,
        description: service.description,
        images: service.images,
        price: service.price.toString(),
        duration_min: service.duration_min,
        staffIds: service.staff?.map((s) => s.id) ?? [],
    };
}

export async function createService(prevState: any, formData: FormData) {
    void prevState;

    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { message: 'Ваш аккаунт заблокирован.' };
    }

    try {
        const profile = await requireProviderProfile(session.user.id);
        const title = (formData.get('title') as string | null)?.trim() || '';
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : 0;
        const durationMinRaw = formData.get('duration_min') ?? formData.get('duration');
        const durationMin = durationMinRaw ? parseInt(durationMinRaw as string, 10) : 60;
        const description = (formData.get('description') as string | null)?.trim() || null;
        const images = parseImages(formData.get('images') ?? formData.get('uploadedPhotoUrls'));
        const staffIds = parseStaffIds(formData.get('staff_ids'));

        if (!title || !isBeautyServiceTitle(title)) {
            return { message: 'Выберите услугу из справочника.' };
        }
        if (Number.isNaN(price) || Number.isNaN(durationMin)) {
            return { message: 'Цена и длительность заполнены некорректно.' };
        }

        // Enforce staff assignment if the profile has staff
        const profileStaffCount = await prisma.staff.count({ where: { profileId: profile.id } });
        if (profileStaffCount > 0 && staffIds.length === 0) {
            return { message: 'Выберите хотя бы одного мастера для этой услуги.' };
        }

        const ownedStaffIds = await filterOwnedStaffIds(profile.id, staffIds);

        const createdService = await prisma.service.create({
            data: {
                title,
                description,
                images,
                price,
                duration_min: durationMin,
                profile_id: profile.id,
                translations: {
                    create: {
                        locale: DEFAULT_LOCALE,
                        title,
                        description,
                        translationSource: 'original',
                    },
                },
                ...(ownedStaffIds.length
                    ? { staff: { connect: ownedStaffIds.map((id) => ({ id })) } }
                    : {}),
            },
        });

        // Create portfolio photos if provided
        const rawPortfolioPhotos = formData.get('portfolio_photos');
        if (typeof rawPortfolioPhotos === 'string' && rawPortfolioPhotos.trim().length > 0) {
            try {
                const portfolioPhotos: Array<{ url: string; staffId: string | null }> =
                    JSON.parse(rawPortfolioPhotos);

                if (Array.isArray(portfolioPhotos) && portfolioPhotos.length > 0) {
                    const validStaffIdSet = new Set(ownedStaffIds);
                    await prisma.$transaction(
                        portfolioPhotos.map((photo, i) =>
                            prisma.portfolioPhoto.create({
                                data: {
                                    profileId: profile.id,
                                    serviceId: createdService.id,
                                    staffId: photo.staffId && validStaffIdSet.has(photo.staffId)
                                        ? photo.staffId
                                        : null,
                                    url: photo.url,
                                    position: i,
                                },
                            })
                        )
                    );
                }
            } catch (parseError) {
                console.warn('Failed to parse portfolio_photos, skipping:', parseError);
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${profile.slug}`);
        redirect('/dashboard?section=services');
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { message: 'Профиль не найден. Пожалуйста, заполните профиль.' };
        }
        if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        console.error('createService error:', error);
        return { message: error?.message || 'Ошибка создания услуги' };
    }
}

export async function updateService(serviceId: string, prevState: any, formData: FormData) {
    void prevState;

    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { message: 'Ваш аккаунт заблокирован.' };
    }

    try {
        const profile = await requireProviderProfile(session.user.id);
        const serviceIdInt = parseInt(serviceId, 10);
        const title = (formData.get('title') as string | null)?.trim() || '';
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : 0;
        const durationMinRaw = formData.get('duration_min') ?? formData.get('duration');
        const durationMin = durationMinRaw ? parseInt(durationMinRaw as string, 10) : 60;
        const description = (formData.get('description') as string | null)?.trim() || null;
        const images = parseImages(formData.get('images') ?? formData.get('uploadedPhotoUrls'));
        const staffIdsRaw = formData.get('staff_ids');
        const staffIdsProvided = staffIdsRaw !== null;
        const staffIds = parseStaffIds(staffIdsRaw);

        if (!title || !isBeautyServiceTitle(title)) {
            return { message: 'Выберите услугу из справочника.' };
        }
        if (Number.isNaN(price) || Number.isNaN(durationMin)) {
            return { message: 'Цена и длительность заполнены некорректно.' };
        }
        if (Number.isNaN(serviceIdInt)) {
            return { message: 'Некорректный идентификатор услуги.' };
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceIdInt },
            select: { id: true, profile_id: true },
        });

        if (!service || service.profile_id !== profile.id) {
            return { message: 'Unauthorized or Service not found' };
        }

        // Enforce staff assignment if the profile has staff
        if (staffIdsProvided) {
            const profileStaffCount = await prisma.staff.count({ where: { profileId: profile.id } });
            if (profileStaffCount > 0 && staffIds.length === 0) {
                return { message: 'Выберите хотя бы одного мастера для этой услуги.' };
            }
        }

        const shouldRedirect = formData.get('redirect_on_success') !== 'false';

        const ownedStaffIds = staffIdsProvided
            ? await filterOwnedStaffIds(profile.id, staffIds)
            : [];

        const updatedService = await prisma.service.update({
            where: { id: serviceIdInt },
            data: {
                title,
                description,
                images,
                price,
                duration_min: durationMin,
                translations: {
                    upsert: {
                        where: {
                            serviceId_locale: {
                                serviceId: serviceIdInt,
                                locale: DEFAULT_LOCALE,
                            },
                        },
                        create: {
                            locale: DEFAULT_LOCALE,
                            title,
                            description,
                            translationSource: 'original',
                        },
                        update: {
                            title,
                            description,
                            translationSource: 'original',
                        },
                    },
                },
                ...(staffIdsProvided
                    ? { staff: { set: ownedStaffIds.map((id) => ({ id })) } }
                    : {}),
            },
            include: { staff: { select: { id: true } } },
        });

        revalidatePath('/dashboard');
        revalidatePath(`/services/${serviceId}`);
        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${profile.slug}`);

        if (shouldRedirect) {
            redirect('/dashboard?section=services');
        }

        return { success: true, service: serializeService(updatedService) };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { message: 'Профиль не найден' };
        }
        if (error?.message === 'NEXT_REDIRECT' || error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        console.error('updateService error:', error);
        return { message: error?.message || 'Ошибка обновления услуги' };
    }
}

export async function addService(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    if (session.user.role !== 'ADMIN') {
        try {
            await requireProviderProfile(session.user.id);
        } catch {
            return { success: false, error: 'Unauthorized' };
        }
    }

    const profileId = parseInt(formData.get('profile_id') as string, 10);
    const title = formData.get('title') as string;
    const priceRaw = formData.get('price') as string;
    const durationRaw = formData.get('duration') as string;
    const price = priceRaw !== '' && priceRaw != null ? parseFloat(priceRaw) : 0;
    const duration = durationRaw !== '' && durationRaw != null ? parseInt(durationRaw, 10) : 0;
    const description = (formData.get('description') as string | null)?.trim() || null;
    const rawImages = formData.get('images') as string | null;
    const staffIds = parseStaffIds(formData.get('staff_ids'));
    let images: string[] = [];

    if (!title || isNaN(profileId)) {
        return { success: false, error: 'Укажите услугу и профиль.' };
    }
    if (price < 0 || duration < 0 || (priceRaw != null && priceRaw !== '' && isNaN(price)) || (durationRaw != null && durationRaw !== '' && isNaN(duration))) {
        return { success: false, error: 'Цена и длительность должны быть неотрицательными числами.' };
    }
    if (!isBeautyServiceTitle(title)) {
        return { success: false, error: 'Можно выбрать только услугу из справочника.' };
    }
    if (rawImages) {
        try {
            images = parseImages(rawImages);
        } catch {
            return { success: false, error: 'Некорректный формат изображений.' };
        }
    }

    try {
        if (session.user.role !== 'ADMIN') {
            const profile = await prisma.profile.findUnique({
                where: { id: profileId },
                select: { user_id: true },
            });
            if (!profile) return { success: false, error: 'Профиль не найден.' };

            const ownsByUserId = profile.user_id && profile.user_id === session.user.id;
            if (!ownsByUserId) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        // Enforce staff assignment if the profile has staff
        const profileStaffCount = await prisma.staff.count({ where: { profileId } });
        if (profileStaffCount > 0 && staffIds.length === 0) {
            return { success: false, error: 'Выберите хотя бы одного мастера для этой услуги.' };
        }

        const ownedStaffIds = await filterOwnedStaffIds(profileId, staffIds);

        const createdService = await prisma.service.create({
            data: {
                profile_id: profileId,
                title,
                description,
                images,
                price,
                duration_min: duration,
                translations: {
                    create: {
                        locale: DEFAULT_LOCALE,
                        title,
                        description,
                        translationSource: 'original',
                    },
                },
                ...(ownedStaffIds.length
                    ? { staff: { connect: ownedStaffIds.map((id) => ({ id })) } }
                    : {}),
            },
            include: {
                staff: { select: { id: true } },
                profile: { select: { slug: true } },
            },
        });

        // Create portfolio photos if provided (from inline uploader during creation)
        const rawPortfolioPhotos = formData.get('portfolio_photos');
        if (typeof rawPortfolioPhotos === 'string' && rawPortfolioPhotos.trim().length > 0) {
            try {
                const portfolioPhotos: Array<{ url: string; staffId: string | null }> =
                    JSON.parse(rawPortfolioPhotos);

                if (Array.isArray(portfolioPhotos) && portfolioPhotos.length > 0) {
                    // Validate staffIds belong to this profile
                    const validStaffIdSet = new Set(ownedStaffIds);

                    await prisma.$transaction(
                        portfolioPhotos.map((photo, i) =>
                            prisma.portfolioPhoto.create({
                                data: {
                                    profileId,
                                    serviceId: createdService.id,
                                    staffId: photo.staffId && validStaffIdSet.has(photo.staffId)
                                        ? photo.staffId
                                        : null,
                                    url: photo.url,
                                    position: i,
                                },
                            })
                        )
                    );
                }
            } catch (parseError) {
                console.warn('Failed to parse portfolio_photos, skipping:', parseError);
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/dashboard', 'layout');
        if (createdService.profile?.slug) {
            revalidatePath(`/salon/${createdService.profile.slug}`);
        }
        return { success: true, service: serializeService(createdService) };
    } catch (error: any) {
        console.error('addService error:', error);
        return { success: false, error: 'Ошибка при добавлении услуги.' };
    }
}

export async function deleteService(serviceId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    if (session.user.role !== 'ADMIN') {
        try {
            await requireProviderProfile(session.user.id);
        } catch {
            return { success: false, error: 'Unauthorized' };
        }
    }

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                id: true,
                profile: {
                    select: { slug: true, user_id: true },
                },
            },
        });
        if (!service) return { success: false, error: 'Услуга не найдена.' };

        if (session.user.role !== 'ADMIN') {
            const ownsByUserId = service.profile.user_id && service.profile.user_id === session.user.id;
            if (!ownsByUserId) {
                return { success: false, error: 'Недостаточно прав.' };
            }
        }

        await prisma.service.delete({
            where: { id: serviceId },
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/salon/${service.profile.slug}`);
        return { success: true };
    } catch (error: any) {
        console.error('deleteService error:', error);
        return { success: false, error: 'Ошибка при удалении услуги.' };
    }
}
