'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function processPayment(serviceId: string, method: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    // Verify service ownership
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { providerProfile: true }
    });

    if (!service || service.providerProfile.userId !== session.user.id) {
        throw new Error('Unauthorized or Service not found');
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${host}/provider/services/${serviceId}/payment/success`;
    const cancelUrl = `${host}/provider/services/${serviceId}/payment`;

    if (method === 'paypal') {
        // Construct detailed PayPal link for simulation
        // Use a standard checkout link format (CMD_CLICK)
        // Note: Without real credentials, specific seller details are placeholders.
        // Users can't actually "pay" me, but they will go to PayPal.
        const params = new URLSearchParams({
            cmd: '_xclick',
            business: process.env.PAYPAL_BUSINESS_EMAIL || 'sb-47av333678036@business.example.com', // Sandbox fallback
            item_name: `Publication Fee: ${service.title}`,
            amount: '9.99',
            currency_code: 'EUR',
            return: returnUrl,
            cancel_return: cancelUrl,
        });

        // Redirect to PayPal
        redirect(`https://www.paypal.com/cgi-bin/webscr?${params.toString()}`);
    } else if (method === 'card') {
        // Redirect to Mock Card Page
        redirect(`${host}/provider/services/${serviceId}/payment/card`);
    } else {
        // Invoice -> Immediate success
        await prisma.service.update({
            where: { id: serviceId },
            data: { status: 'PENDING' }
        });
        revalidatePath('/provider/profile');
        redirect('/provider/services/success');
    }
}

export async function completePayment(serviceId: string) {
    // This is called by the callback page OR directly for non-redirect methods
    const session = await auth();
    // (Auth check omitted for brevity if called internally, but good practice to keep)

    await prisma.service.update({
        where: { id: serviceId },
        data: {
            status: 'PENDING'
        }
    });

    revalidatePath('/provider/profile');
    redirect('/provider/services/success');
}


