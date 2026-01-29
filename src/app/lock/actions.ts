'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyPassword(formData: FormData) {
    const password = formData.get('password') as string;
    const correctPassword = process.env.SITE_PASSWORD || 'svoi2026';

    if (password === correctPassword) {
        cookies().set('site_access', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });
        redirect('/');
    } else {
        return { error: 'Неверный пароль' };
    }
}
