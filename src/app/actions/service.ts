'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createService(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized' };
    }

    try {
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const categoryId = formData.get('categoryId') as string;
        const cityId = formData.get('cityId') as string;
        const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
        const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;
        const experience = formData.get('experience') ? parseInt(formData.get('experience') as string) : null;
        const equipment = formData.get('equipment') as string;
        const schedule = formData.get('schedule') as string;
        const workTime = formData.get('workTime') as string;
        const subcategory = formData.get('subcategory') as string;
        const locationTypes = formData.getAll('locationType') as string[];
        const locationType = locationTypes.join(', ');
        const priceList = formData.get('priceList') as string;
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : null;

        if (!description || description.length < 20) return { message: 'Описание должно быть не менее 20 символов' };
        if (!categoryId) return { message: 'Выберите категорию' };
        // if (!subcategory) return { message: 'Выберите подкатегорию' }; // Removed strict check
        // if (!schedule) return { message: 'Выберите график работы' }; // Allow default schedule
        // if (!workTime) return { message: 'Выберите время работы' }; // Allow default workTime

        let providerProfile = await prisma.providerProfile.findUnique({ where: { userId: session.user.id } });
        if (!providerProfile) {
            providerProfile = await prisma.providerProfile.create({ data: { userId: session.user.id } });
        }

        const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });

        let finalTitle = title;
        if (!finalTitle && category) {
            const sub = subcategory;
            let subName = sub;
            try {
                const parsed = JSON.parse(sub);
                if (Array.isArray(parsed) && parsed.length > 0) subName = parsed[0].name;
            } catch (e) { }
            finalTitle = subName ? `${category.name} - ${subName}` : category.name;
        }

        let city;
        if (cityId === 'NEW_CITY') {
            const customName = formData.get('customCityName') as string;
            if (!customName) return { message: 'Для новой локации требуется указать город' };
            const existing = await prisma.city.findFirst({ where: { name: customName } });
            if (existing) city = existing;
            else {
                const slug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `city-${Date.now()}`;
                const existingSlug = await prisma.city.findUnique({ where: { slug } });
                const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;
                city = await prisma.city.create({ data: { name: customName, slug: finalSlug } });
            }
        } else {
            city = cityId ? await prisma.city.findUnique({ where: { id: cityId } }) : await prisma.city.findFirst();
        }

        if (!category || !city) return { message: 'Категория или Город не найдены' };

        const service = await prisma.service.create({
            data: {
                title: finalTitle,
                description,
                price: price || 0,
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
                priceList
            }
        });

        const uploadedPhotos = JSON.parse(formData.get('uploadedPhotoUrls') as string || '[]');
        if (Array.isArray(uploadedPhotos) && uploadedPhotos.length > 0) {
            await prisma.serviceImage.createMany({
                data: uploadedPhotos.map((url: string) => ({ url, serviceId: service.id }))
            });
        }

        revalidatePath('/provider/profile');
        revalidatePath('/admin/moderation');
        redirect(`/provider/services/${service.id}/payment`);

    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT' || e.digest?.includes('NEXT_REDIRECT')) throw e;
        console.error("Create Service Error:", e);
        return { message: e.message || 'Ошибка создания услуги' };
    }
}

export async function updateService(serviceId: string, prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: 'Unauthorized' };
    }

    try {
        // Validation Logic (Same as Create)
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const categoryId = formData.get('categoryId') as string;
        const cityId = formData.get('cityId') as string;
        const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
        const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;
        const experience = formData.get('experience') ? parseInt(formData.get('experience') as string) : null;
        const equipment = formData.get('equipment') as string;
        const schedule = formData.get('schedule') as string;
        const workTime = formData.get('workTime') as string;
        const subcategory = formData.get('subcategory') as string;
        const locationTypes = formData.getAll('locationType') as string[];
        const locationType = locationTypes.join(', ');
        const priceList = formData.get('priceList') as string;
        const rawPrice = formData.get('price');
        const price = rawPrice ? parseFloat(rawPrice as string) : null;

        if (!description || description.length < 20) return { message: 'Описание должно быть не менее 20 символов' };
        if (!categoryId) return { message: 'Выберите категорию' };
        if (!subcategory) return { message: 'Выберите подкатегорию' };
        if (!schedule) return { message: 'Выберите график работы' };
        if (!workTime) return { message: 'Выберите время работы' };

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { providerProfile: true }
        });

        if (!service || service.providerProfile.userId !== session.user.id) {
            return { message: 'Unauthorized or Service not found' };
        }

        const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });

        let finalTitle = title;
        if (!finalTitle && category) {
            const sub = subcategory;
            let subName = sub;
            try {
                const parsed = JSON.parse(sub);
                if (Array.isArray(parsed) && parsed.length > 0) subName = parsed[0].name;
            } catch (e) { }
            finalTitle = subName ? `${category.name} - ${subName}` : category.name;
        }

        let city;
        if (cityId === 'NEW_CITY') {
            const customName = formData.get('customCityName') as string;
            if (customName) {
                const existing = await prisma.city.findFirst({ where: { name: customName } });
                if (existing) city = existing;
                else {
                    const slug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `city-${Date.now()}`;
                    const existingSlug = await prisma.city.findUnique({ where: { slug } });
                    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;
                    city = await prisma.city.create({ data: { name: customName, slug: finalSlug } });
                }
            } else {
                city = await prisma.city.findFirst();
            }
        } else {
            city = cityId ? await prisma.city.findUnique({ where: { id: cityId } }) : await prisma.city.findFirst();
        }

        if (!category || !city) return { message: 'Категория или Город не найдены' };

        await prisma.service.update({
            where: { id: serviceId },
            data: {
                title: finalTitle,
                description,
                price: price || 0,
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
                priceList
            }
        });

        const uploadedPhotos = JSON.parse(formData.get('uploadedPhotoUrls') as string || '[]');
        if (Array.isArray(uploadedPhotos)) {
            await prisma.serviceImage.deleteMany({ where: { serviceId } });
            if (uploadedPhotos.length > 0) {
                await prisma.serviceImage.createMany({
                    data: uploadedPhotos.map((url: string) => ({ url, serviceId }))
                });
            }
        }

        revalidatePath('/provider/profile');
        revalidatePath(`/services/${serviceId}`);
        redirect('/provider/profile');

    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT' || e.digest?.includes('NEXT_REDIRECT')) throw e;
        console.error("Update Service Error:", e);
        return { message: e.message || 'Ошибка обновления услуги' };
    }
}
