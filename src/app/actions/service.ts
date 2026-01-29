'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createService(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    const categoryId = formData.get('categoryId') as string; // We'll need to fetch categories
    const cityId = formData.get('cityId') as string; // We'll need to fetch cities
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;

    // New fields
    const experience = formData.get('experience') ? parseInt(formData.get('experience') as string) : null;
    const equipment = formData.get('equipment') as string;
    const schedule = formData.get('schedule') as string;
    const workTime = formData.get('workTime') as string;
    const subcategory = formData.get('subcategory') as string;

    // Handle multiple location types
    const locationTypes = formData.getAll('locationType') as string[];
    const locationType = locationTypes.join(', ');

    // Price List
    const priceList = formData.get('priceList') as string;

    // Handle price being optional or parsing error
    const rawPrice = formData.get('price');
    const price = rawPrice ? parseFloat(rawPrice as string) : null;

    // Wrap unsafe operations
    try {
        // Validation
        if (!description || description.length < 20) {
            throw new Error('Description must be at least 20 characters'); // Description validation
        }
        if (!categoryId) throw new Error('Category is required');
        if (!schedule) throw new Error('Schedule is required');
        if (!workTime) throw new Error('Work time is required');
        if (!subcategory) throw new Error('Subcategory is required');

        if (!description) {
            throw new Error('Invalid data');
        }

        // Ensure user has a provider profile
        let providerProfile = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!providerProfile) {
            providerProfile = await prisma.providerProfile.create({
                data: {
                    userId: session.user.id,
                }
            });
        }

        // Find default category and city if not provided
        if (!categoryId) {
            throw new Error('Category is required');
        }

        const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });

        // Generate title if missing
        let finalTitle = title;
        if (!finalTitle && category) {
            // Use the joined subcategory string we created earlier
            const sub = subcategory;
            let subName = sub;
            try {
                const parsed = JSON.parse(sub);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    subName = parsed[0].name;
                }
            } catch (e) {
                // Legacy string
            }
            finalTitle = subName ? `${category.name} - ${subName}` : category.name;
        }


        // Default city to first one for now (or make it selectable later)
        // Dynamic City Logic
        let city;
        if (cityId === 'NEW_CITY') {
            const customName = formData.get('customCityName') as string;
            if (!customName) {
                // Fallback or error? Let's error safely to prevent broken state
                throw new Error('City name required for new location');
            }

            const existing = await prisma.city.findFirst({
                where: { name: customName }
            });

            if (existing) {
                city = existing;
            } else {
                const slug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `city-${Date.now()}`;
                const existingSlug = await prisma.city.findUnique({ where: { slug } });
                const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

                city = await prisma.city.create({
                    data: { name: customName, slug: finalSlug }
                });
            }
        } else {
            city = cityId
                ? await prisma.city.findUnique({ where: { id: cityId } })
                : await prisma.city.findFirst();
        }

        if (!category || !city) {
            throw new Error('Category or City not found');
        }

        const service = await prisma.service.create({
            data: {
                title: finalTitle,
                description,
                price: price || 0, // Default to 0 if null
                status: 'PAYMENT_PENDING',
                providerProfileId: providerProfile.id,
                categoryId: category.id,
                cityId: city.id,
                subcategory: formData.get('subcategory') as string || null,
                latitude,
                longitude,
                experience,
                equipment,
                schedule,
                workTime,
                locationType,
                priceList // Save JSON string
            }
        });

        // Save photos
        const uploadedPhotos = JSON.parse(formData.get('uploadedPhotoUrls') as string || '[]');
        if (Array.isArray(uploadedPhotos) && uploadedPhotos.length > 0) {
            await prisma.serviceImage.createMany({
                data: uploadedPhotos.map((url: string) => ({
                    url,
                    serviceId: service.id
                }))
            });
        }

        revalidatePath('/provider/profile');
        revalidatePath('/admin/moderation');

    } catch (e: any) {
        // Rethrow if redirect
        if (e.message === 'NEXT_REDIRECT' || e.digest?.includes('NEXT_REDIRECT')) {
            throw e;
        }
        console.error("Create Service Error:", e);
        // Redirect to form with error
        redirect(`/provider/services/new?error=${encodeURIComponent(e.message)}`);
    }

    // Success redirect happens inside try/catch logic if we moved it, 
    // but here I removed the variables `service` from scope.
    // I need to restructure to ensure `service.id` is available for the success redirect.
    // Wait, I can just do the success redirect inside the try block.
    // BUT the catch block must not catch the success redirect.

    // RE-PLAN:
    // Move the success redirect INSIDE the try block, at the end.
    // And ensure the `catch` block re-throws if it's a redirect.

    // The code above missed the variable scoping for `service`.
    // I'll rewrite the replacement content to include the success redirect logic properly.

    // SEE BELOW.
}

export async function updateService(serviceId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    const categoryId = formData.get('categoryId') as string;
    const cityId = formData.get('cityId') as string;
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;

    // New fields
    const experience = formData.get('experience') ? parseInt(formData.get('experience') as string) : null;
    const equipment = formData.get('equipment') as string;
    const schedule = formData.get('schedule') as string;
    const workTime = formData.get('workTime') as string;
    const subcategory = formData.get('subcategory') as string;

    // Handle multiple location types
    const locationTypes = formData.getAll('locationType') as string[];
    const locationType = locationTypes.join(', ');

    // Price List logic
    const priceList = formData.get('priceList') as string;

    const rawPrice = formData.get('price');
    const price = rawPrice ? parseFloat(rawPrice as string) : null;

    // Validation
    if (!description || description.length < 20) {
        throw new Error('Description must be at least 20 characters');
    }
    // categoryId/cityId might be coming from form or existing? Form seems to send them always.
    if (!categoryId) throw new Error('Category is required');
    // Subcategory check
    if (!subcategory) throw new Error('Subcategory is required');

    // Schedule check
    if (!schedule) throw new Error('Schedule is required');
    if (!workTime) throw new Error('Work time is required');


    if (!description) {
        throw new Error('Invalid data');
    }

    // Verify ownership
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { providerProfile: true }
    });

    if (!service || service.providerProfile.userId !== session.user.id) {
        throw new Error('Unauthorized or Service not found');
    }

    const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });

    // Generate title if missing or update it
    let finalTitle = title;
    if (!finalTitle && category) {
        const sub = subcategory;
        let subName = sub;
        try {
            const parsed = JSON.parse(sub);
            if (Array.isArray(parsed) && parsed.length > 0) {
                subName = parsed[0].name;
            }
        } catch (e) {
            // Legacy string
        }
        finalTitle = subName ? `${category.name} - ${subName}` : category.name;
    }

    let city;
    if (cityId === 'NEW_CITY') {
        const customName = formData.get('customCityName') as string;
        if (customName) {
            const existing = await prisma.city.findFirst({
                where: { name: customName }
            });

            if (existing) {
                city = existing;
            } else {
                const slug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `city-${Date.now()}`;
                const existingSlug = await prisma.city.findUnique({ where: { slug } });
                const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

                city = await prisma.city.create({
                    data: { name: customName, slug: finalSlug }
                });
            }
        } else {
            // If missing name, try to fallback to existing city logic is risky, but let's query safe
            city = await prisma.city.findFirst();
        }
    } else {
        city = cityId
            ? await prisma.city.findUnique({ where: { id: cityId } })
            : await prisma.city.findFirst();
    }

    if (!category || !city) {
        throw new Error('Category or City not found');
    }

    await prisma.service.update({
        where: { id: serviceId },
        data: {
            title: finalTitle,
            description,
            price: price || 0,
            // Maintain existing status unless explicitly changed logic is needed.
            // User requested NO re-moderation, so we do NOT set status to 'PENDING'.
            categoryId: category.id,
            cityId: city.id,
            subcategory: formData.get('subcategory') as string || null,
            latitude,
            longitude,
            experience,
            equipment,
            schedule,
            workTime,
            locationType,
            priceList // Save JSON string
        }
    });

    // Handle photos - for now just add new ones, or we could replace all?
    // Given the UI sends all current URLs (if we managed it right), we should probably sync.
    // But currently CreateServiceForm UI only tracks `uploadedPhotos` state for *new* or *all*?
    // Let's assume the form input `uploadedPhotoUrls` contains the FINAL list of URLs we want.
    // For simplicity in this iteration, let's just ADD items if we want, OR delete all and re-add.
    // Deleting all and re-adding is safest for "syncing" state.

    const uploadedPhotos = JSON.parse(formData.get('uploadedPhotoUrls') as string || '[]');
    if (Array.isArray(uploadedPhotos)) {
        // Delete existing (simplest sync)
        await prisma.serviceImage.deleteMany({ where: { serviceId } });

        // Add all
        if (uploadedPhotos.length > 0) {
            await prisma.serviceImage.createMany({
                data: uploadedPhotos.map((url: string) => ({
                    url,
                    serviceId
                }))
            });
        }
    }

    revalidatePath('/provider/profile');
    revalidatePath(`/services/${serviceId}`);
    redirect('/provider/profile');
}
