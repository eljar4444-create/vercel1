import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { registerRateLimit } from '@/lib/rate-limit';
import { localeFromRequest, safeParseWithLocale } from '@/i18n/zod';
import { getTranslations } from 'next-intl/server';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

export async function POST(req: NextRequest) {
    const locale = localeFromRequest(req);
    const t = await getTranslations({ locale, namespace: 'auth.api' });
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 16) {
        console.error('Registration: JWT_SECRET is missing or too short (min 16 chars)');
        return NextResponse.json(
            { error: t('serverMisconfigured') },
            { status: 500 }
        );
    }

    try {
        const roleParam = req.nextUrl.searchParams.get('role');
        const typeParam = req.nextUrl.searchParams.get('type');
        const isProviderRegistration = roleParam === 'provider';
        const onboardingType = typeParam === 'SALON' ? 'SALON' : 'INDIVIDUAL';

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: t('invalidJson') }, { status: 400 });
        }

        // 1. Honeypot check: if website_url is filled, fake 200 OK immediately
        const rawBody = body && typeof body === 'object' ? body as Record<string, unknown> : {};
        if (typeof rawBody.website_url === 'string' && rawBody.website_url.trim().length > 0) {
            console.log('Bot detected via honeypot field. Returning fake success.');
            // Return fake 200 to trick the bot without touching the DB
            return NextResponse.json({
                success: true,
                token: 'honeypot-fake-token-do-not-use',
                user: {
                    id: 0,
                    email: typeof rawBody.email === 'string' ? rawBody.email : 'bot@example.com',
                    role: 'USER',
                    name: typeof rawBody.name === 'string' ? rawBody.name : 'Bot User',
                },
            });
        }

        const result = await safeParseWithLocale(RegisterSchema, body, locale);

        if (!result.success) {
            const firstIssue = result.error.flatten().fieldErrors;
            const message = firstIssue.email?.[0] ?? firstIssue.password?.[0] ?? firstIssue.name?.[0] ?? t('invalidInput');
            return NextResponse.json({ error: message }, { status: 400 });
        }

        // Extract client IP for rate limiting and AGB acceptance record
        const clientIp =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // 2. IP Rate Limiting (5 attempts per hour)
        if (clientIp !== 'unknown') {
            const rateLimit = await registerRateLimit.limit(clientIp);
            if (!rateLimit.success) {
                return NextResponse.json(
                    { error: t('registerRateLimited') },
                    { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) } }
                );
            }
        }

        const { email, password, name } = result.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json(
                { error: t('emailTaken') },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'USER',
                agbAcceptedAt: new Date(),
                agbAcceptedIp: clientIp,
                ...(isProviderRegistration
                    ? {
                        onboardingCompleted: false,
                        onboardingType,
                        providerType: onboardingType,
                    }
                    : {}),
            },
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, name: user.name },
        });

    } catch (error: unknown) {
        console.error('Registration error:', error);

        // Prisma unique constraint (e.g. race: email taken between findUnique and create)
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                { error: t('emailTaken') },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: t('createAccountError') },
            { status: 500 }
        );
    }
}
