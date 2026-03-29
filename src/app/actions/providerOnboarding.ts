'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { generateUniqueSlug } from '@/lib/generateUniqueSlug';
import { geocodeAddress } from '@/lib/geocode';
import { buildSchedulePayload, createUniformSchedule } from '@/lib/scheduling';
import type { Prisma, ProviderType } from '@prisma/client';

interface ProviderOnboardingResult {
    success: boolean;
    error?: string;
    profileId?: number;
}

const DRAFT_PROVIDER_STATUS = 'DRAFT' as const;
const PENDING_PROVIDER_STATUS = 'PENDING_REVIEW' as const;

type WorkLocationPayload = {
    placeName: string;
    street: string;
    houseNumber: string;
    address: string;
    zipCode: string;
    city: string;
    cityLatitude: number | null;
    cityLongitude: number | null;
    latitude: number | null;
    longitude: number | null;
    hideExactAddress: boolean;
};

type ParsedDraftPayload = {
    name: string;
    city: string;
    providerType: ProviderType;
    address: string;
    bio: string;
    categoryId: number | null;
    workLocations: WorkLocationPayload[];
    languages: string[];
    audiences: string[];
    managerName: string;
    zipCode: string;
    cityLatitude: number | null;
    cityLongitude: number | null;
    addressLatitude: number | null;
    addressLongitude: number | null;
    providesInStudio: boolean;
    providesOutcall: boolean;
    outcallRadiusKm: number | null;
    step: number;
    geocode: boolean;
};

type OwnedProfile = {
    id: number;
    slug: string;
    user_id: string | null;
    user_email: string;
    name: string;
    city: string;
    address: string | null;
    bio: string | null;
    category_id: number;
    provider_type: ProviderType;
    attributes: unknown;
    languages: string[];
    latitude: number | null;
    longitude: number | null;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'SUSPENDED';
    providesInStudio: boolean;
    providesOutcall: boolean;
    outcallRadiusKm: number | null;
};

const GEO_ERROR_MESSAGE =
    'Мы не смогли найти этот адрес на карте. Пожалуйста, проверьте правильность написания города и адреса или укажите ближайший крупный ориентир.';

function normalizeProviderType(rawValue: string): ProviderType {
    if (rawValue === 'SALON') return 'SALON';
    if (rawValue === 'INDIVIDUAL') return 'INDIVIDUAL';
    return 'PRIVATE';
}

function normalizeStep(rawValue: FormDataEntryValue | null) {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed)) return 1;
    return Math.min(5, Math.max(1, parsed));
}

function parseCoordinate(value: FormDataEntryValue | null) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function splitStreetAndHouse(address: string) {
    const value = address.trim();
    if (!value) {
        return { street: '', houseNumber: '' };
    }

    const match = value.match(/^(.*?)(?:\s+(\d+[a-zA-Z]?(?:[/-]\d+[a-zA-Z]?)?))$/);
    if (!match) {
        return { street: value, houseNumber: '' };
    }

    return {
        street: match[1]?.trim() || value,
        houseNumber: match[2]?.trim() || '',
    };
}

function parseWorkLocations(rawValue: FormDataEntryValue | null) {
    if (typeof rawValue !== 'string' || !rawValue.trim()) {
        return [] as WorkLocationPayload[];
    }

    try {
        const parsed = JSON.parse(rawValue);
        if (!Array.isArray(parsed)) {
            return [] as WorkLocationPayload[];
        }

        return parsed
            .map((item) => {
                const address = String(item?.address || '').trim();
                const parts = splitStreetAndHouse(address);

                return {
                    placeName: String(item?.placeName || '').trim(),
                    street: String(item?.street || parts.street || '').trim(),
                    houseNumber: String(item?.houseNumber || parts.houseNumber || '').trim(),
                    address,
                    zipCode: String(item?.zipCode || '').trim(),
                    city: String(item?.city || '').trim(),
                    cityLatitude: Number.isFinite(Number(item?.cityLatitude)) ? Number(item.cityLatitude) : null,
                    cityLongitude: Number.isFinite(Number(item?.cityLongitude)) ? Number(item.cityLongitude) : null,
                    latitude: Number.isFinite(Number(item?.latitude)) ? Number(item.latitude) : null,
                    longitude: Number.isFinite(Number(item?.longitude)) ? Number(item.longitude) : null,
                    hideExactAddress: Boolean(item?.hideExactAddress),
                };
            })
            .filter((location) =>
                location.placeName ||
                location.street ||
                location.houseNumber ||
                location.address ||
                location.zipCode ||
                location.city
            );
    } catch {
        return [] as WorkLocationPayload[];
    }
}

function asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return { ...(value as Record<string, unknown>) };
}

function buildDraftAttributes(
    currentAttributes: unknown,
    payload: ParsedDraftPayload,
): Prisma.InputJsonValue {
    const attributes = asObject(currentAttributes);

    attributes.onboardingDraft = {
        managerName: payload.managerName || null,
        audiences: payload.audiences,
        workLocations: payload.workLocations,
        zipCode: payload.zipCode || null,
    };

    return attributes as Prisma.InputJsonValue;
}

function stripDraftAttributes(currentAttributes: unknown): Prisma.InputJsonValue {
    const attributes = asObject(currentAttributes);
    delete attributes.onboardingDraft;
    return attributes as Prisma.InputJsonValue;
}

function parseDraftPayload(formData: FormData): ParsedDraftPayload {
    const submittedCategoryId = Number(formData.get('category_id'));
    const outcallRadiusKmRaw = Number(formData.get('outcall_radius_km'));

    return {
        name: String(formData.get('name') || '').trim(),
        city: String(formData.get('city') || '').trim(),
        providerType: normalizeProviderType(String(formData.get('provider_type') || 'PRIVATE').trim()),
        address: String(formData.get('address') || '').trim(),
        bio: String(formData.get('bio') || '').trim(),
        categoryId: Number.isInteger(submittedCategoryId) ? submittedCategoryId : null,
        workLocations: parseWorkLocations(formData.get('work_locations')),
        languages: formData
            .getAll('languages')
            .map((value) => String(value).trim())
            .filter(Boolean),
        audiences: formData
            .getAll('audiences')
            .map((value) => String(value).trim())
            .filter(Boolean),
        managerName: String(formData.get('manager_name') || '').trim(),
        zipCode: String(formData.get('zip_code') || '').trim(),
        cityLatitude: parseCoordinate(formData.get('city_latitude')),
        cityLongitude: parseCoordinate(formData.get('city_longitude')),
        addressLatitude: parseCoordinate(formData.get('address_latitude')),
        addressLongitude: parseCoordinate(formData.get('address_longitude')),
        providesInStudio: String(formData.get('provides_in_studio') || 'true') === 'true',
        providesOutcall: String(formData.get('provides_outcall') || 'false') === 'true',
        outcallRadiusKm:
            Number.isInteger(outcallRadiusKmRaw) && outcallRadiusKmRaw >= 1 && outcallRadiusKmRaw <= 100
                ? outcallRadiusKmRaw
                : null,
        step: normalizeStep(formData.get('step')),
        geocode: String(formData.get('geocode') || 'false') === 'true',
    };
}

async function resolveCategoryId(categoryId: number | null) {
    if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
        return categoryId;
    }

    const beautyCategory = await prisma.category.findFirst({
        where: { slug: 'beauty' },
        select: { id: true },
    });

    return beautyCategory?.id ?? 1;
}

async function findOwnedProfile(userId: string, email: string) {
    return prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: userId },
                { user_email: email },
            ],
        },
        select: {
            id: true,
            slug: true,
            user_id: true,
            user_email: true,
            name: true,
            city: true,
            address: true,
            bio: true,
            category_id: true,
            provider_type: true,
            attributes: true,
            languages: true,
            latitude: true,
            longitude: true,
            status: true,
            providesInStudio: true,
            providesOutcall: true,
            outcallRadiusKm: true,
        },
    });
}

async function prepareDraftData(
    session: { user: { id: string; email: string; name?: string | null } },
    payload: ParsedDraftPayload,
    existingProfile: OwnedProfile | null,
) {
    const categoryId = await resolveCategoryId(payload.categoryId);
    const currentAttributes = existingProfile?.attributes;

    let city =
        payload.providesInStudio && payload.providerType !== 'SALON' && payload.workLocations.length > 0
            ? payload.workLocations[0].city
            : payload.city;
    let address =
        payload.providesInStudio && payload.providerType !== 'SALON' && payload.workLocations.length > 0
            ? payload.workLocations[0].address
            : payload.address;
    let latitude = existingProfile?.latitude ?? null;
    let longitude = existingProfile?.longitude ?? null;

        if (payload.geocode) {
        if (payload.providesInStudio && payload.providerType === 'SALON') {
            if (!payload.city || !payload.address) {
                return { error: 'Заполните город, улицу и номер дома.' };
            }

            if (payload.addressLatitude != null && payload.addressLongitude != null) {
                city = payload.city;
                address = payload.address;
                latitude = payload.addressLatitude;
                longitude = payload.addressLongitude;
            } else {
                const geo = await geocodeAddress(payload.address, payload.city, payload.zipCode);
                if (!geo) {
                    return { error: GEO_ERROR_MESSAGE };
                }

                city = geo.city || payload.city;
                address = payload.address;
                latitude = geo.lat;
                longitude = geo.lng;
            }
        } else if (payload.providesInStudio && payload.workLocations.length > 0) {
            const primaryLocation = payload.workLocations[0];
            if (
                !primaryLocation.address ||
                !primaryLocation.city
            ) {
                return { error: 'Заполните город, улицу и номер дома в месте работы.' };
            }

            if (primaryLocation.latitude != null && primaryLocation.longitude != null) {
                city = primaryLocation.city;
                address = primaryLocation.address;
                latitude = primaryLocation.latitude;
                longitude = primaryLocation.longitude;
            } else {
                const geo = await geocodeAddress(
                    primaryLocation.address,
                    primaryLocation.city,
                    primaryLocation.zipCode,
                );
                if (!geo) {
                    return { error: GEO_ERROR_MESSAGE };
                }

                city = geo.city || primaryLocation.city;
                address = primaryLocation.address;
                latitude = geo.lat;
                longitude = geo.lng;
            }
        } else if (payload.providesOutcall && payload.city) {
            if (payload.cityLatitude != null && payload.cityLongitude != null) {
                latitude = payload.cityLatitude;
                longitude = payload.cityLongitude;
                city = payload.city;
                address = '';
            } else {
                const geo = await geocodeAddress('', payload.city, payload.zipCode);
                if (!geo) {
                    return { error: GEO_ERROR_MESSAGE };
                }

                city = geo.city || payload.city;
                address = '';
                latitude = geo.lat;
                longitude = geo.lng;
            }
        }
    }

    const safeName =
        payload.name ||
        existingProfile?.name ||
        session.user.name?.trim() ||
        session.user.email.split('@')[0] ||
        'Draft profile';
    const safeCity = city || existingProfile?.city || 'Draft';
    const safeAddress = payload.providesInStudio
        ? address || existingProfile?.address || null
        : null;
    const safeBio = payload.bio || existingProfile?.bio || null;
    const slug = existingProfile
        ? await generateUniqueSlug(safeName, safeCity, existingProfile.id)
        : await generateUniqueSlug(safeName, safeCity);

    return {
        data: {
            name: safeName,
            slug,
            provider_type: payload.providerType,
            city: safeCity,
            address: safeAddress,
            bio: safeBio,
            category_id: categoryId,
            attributes: buildDraftAttributes(currentAttributes, payload),
            languages: payload.languages,
            latitude,
            longitude,
            status: DRAFT_PROVIDER_STATUS,
            onboardingStep: payload.step,
            providesInStudio: payload.providesInStudio,
            providesOutcall: payload.providesOutcall,
            outcallRadiusKm: payload.providesOutcall ? payload.outcallRadiusKm : null,
            user_id: session.user.id,
        },
    };
}

export async function saveProviderDraft(formData: FormData): Promise<ProviderOnboardingResult> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: 'Требуется авторизация.' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    const payload = parseDraftPayload(formData);

    try {
        const existingProfile = await findOwnedProfile(session.user.id, session.user.email);

        if (existingProfile?.status === 'PUBLISHED') {
            return { success: true, profileId: existingProfile.id };
        }

        const prepared = await prepareDraftData(
            { user: { id: session.user.id, email: session.user.email, name: session.user.name } },
            payload,
            existingProfile,
        );
        if ('error' in prepared) {
            return { success: false, error: prepared.error };
        }

        const profile = existingProfile
            ? await prisma.profile.update({
                where: { id: existingProfile.id },
                data: prepared.data,
                select: { id: true },
            })
            : await prisma.profile.create({
                data: {
                    ...prepared.data,
                    user_email: session.user.email,
                },
                select: { id: true },
            });

        return { success: true, profileId: profile.id };
    } catch (error) {
        console.error('[providerOnboarding] saveProviderDraft error:', error);
        return { success: false, error: 'Не удалось сохранить черновик профиля.' };
    }
}

export async function createProviderProfile(formData: FormData): Promise<ProviderOnboardingResult> {
    formData.set('step', formData.get('step') ? String(normalizeStep(formData.get('step'))) : '3');
    formData.set('geocode', 'true');
    return saveProviderDraft(formData);
}

export async function publishProviderProfile(formData: FormData): Promise<ProviderOnboardingResult> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: 'Требуется авторизация.' };
    }
    if (session.user.isBanned) {
        return { success: false, error: 'Ваш аккаунт заблокирован.' };
    }

    const requestedProfileId = Number(formData.get('profile_id'));
    const serviceTitle = String(formData.get('service_title') || '').trim();
    const serviceDescription = String(formData.get('service_description') || '').trim();
    const serviceImageUrl = String(formData.get('service_image_url') || '').trim();
    const servicePrice = Number(formData.get('service_price'));
    const serviceDuration = Number(formData.get('service_duration'));
    const startTime = String(formData.get('start_time') || '').trim();
    const endTime = String(formData.get('end_time') || '').trim();
    const workingDays = formData
        .getAll('working_days')
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value));

    if (!Number.isInteger(requestedProfileId)) {
        return { success: false, error: 'Профиль не найден.' };
    }
    if (!serviceTitle || !Number.isFinite(servicePrice) || !Number.isFinite(serviceDuration)) {
        return { success: false, error: 'Укажите корректную первую услугу.' };
    }
    if (!startTime || !endTime || workingDays.length === 0) {
        return { success: false, error: 'Настройте расписание перед отправкой.' };
    }

    // Soft lock: require taxId (Steuernummer) before publishing
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { taxId: true },
    });
    if (!currentUser?.taxId?.trim()) {
        return {
            success: false,
            error: 'Für die Veröffentlichung Ihres Profils ist eine Steuernummer erforderlich. Bitte tragen Sie diese in Ihren Profileinstellungen ein.',
        };
    }

    const draftSaveResult = await saveProviderDraft(formData);
    if (!draftSaveResult.success || !draftSaveResult.profileId) {
        return draftSaveResult;
    }

    try {
        const profileId = draftSaveResult.profileId;
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: {
                id: true,
                user_id: true,
                user_email: true,
                slug: true,
                attributes: true,
                latitude: true,
                longitude: true,
            },
        });

        if (!profile) {
            return { success: false, error: 'Профиль не найден.' };
        }

        const ownsByUserId = profile.user_id === session.user.id;
        const ownsByEmail = profile.user_email === session.user.email;
        if (session.user.role !== 'ADMIN' && !ownsByUserId && !ownsByEmail) {
            return { success: false, error: 'Недостаточно прав.' };
        }
        if (profile.latitude == null || profile.longitude == null) {
            return { success: false, error: 'Добавьте корректный адрес перед отправкой.' };
        }

        const updated = await prisma.$transaction(async (tx) => {
            await tx.service.deleteMany({
                where: { profile_id: profileId },
            });

            await tx.service.create({
                data: {
                    profile_id: profileId,
                    title: serviceTitle,
                    description: serviceDescription || null,
                    images: serviceImageUrl ? [serviceImageUrl] : [],
                    price: servicePrice,
                    duration_min: serviceDuration,
                },
            });

            const publishedProfile = await tx.profile.update({
                where: { id: profileId },
                data: {
                    schedule: buildSchedulePayload(createUniformSchedule(workingDays, startTime, endTime).days),
                    status: PENDING_PROVIDER_STATUS,
                    onboardingStep: 5,
                    attributes: stripDraftAttributes(profile.attributes),
                },
                select: { id: true, slug: true },
            });

            await tx.user.update({
                where: { id: session.user.id },
                data: { onboardingCompleted: true },
            });

            return publishedProfile;
        });

        revalidatePath('/');
        revalidatePath('/dashboard', 'layout');
        revalidatePath('/search');
        if (updated.slug) {
            revalidatePath(`/salon/${updated.slug}`);
        }

        return { success: true, profileId: updated.id };
    } catch (error) {
        console.error('[providerOnboarding] publishProviderProfile error:', error);
        return { success: false, error: 'Не удалось отправить профиль на модерацию.' };
    }
}
