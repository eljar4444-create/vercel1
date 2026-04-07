'use server';

import { redirect } from 'next/navigation';

export async function verifyPassword(formData: FormData) {
    const password = formData.get('password') as string;
    const correctPassword = process.env.SITE_PASSWORD;

    if (!correctPassword) {
        throw new Error('SITE_PASSWORD env variable is not set');
    }

    if (password === correctPassword) {
        // Redirect to home — the client lock page stores access state in localStorage
        redirect('/');
    } else {
        return { error: 'Неверный пароль' };
    }
}
