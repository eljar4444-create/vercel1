import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { loginRateLimit } from '@/lib/rate-limit';
import { localeFromRequest, safeParseWithLocale } from '@/i18n/zod';
import { getTranslations } from 'next-intl/server';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function POST(req: NextRequest) {
    const locale = localeFromRequest(req);
    const t = await getTranslations({ locale, namespace: 'auth.api' });

    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: t('invalidJson') }, { status: 400 });
        }

        const result = await safeParseWithLocale(LoginSchema, body, locale);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0]?.message ?? t('invalidInput') },
                { status: 400 },
            );
        }

        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';
        const rateLimit = await loginRateLimit.limit(ip);

        if (!rateLimit.success) {
            return NextResponse.json(
                { error: t('tooManyRequests') },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
                    },
                }
            );
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return NextResponse.json({ error: t('invalidCredentials') }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: t('invalidCredentials') }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, name: user.name },
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: t('internalServerError') }, { status: 500 });
    }
}
