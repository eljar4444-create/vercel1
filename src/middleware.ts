import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, isLocale, isPrefixedLocale, type Locale } from '@/i18n/config';

// Accept-Language redirects only affect public, unprefixed visits. System
// routes stay unprefixed and always use the default-locale route tree.
const ENABLE_LOCALE_REDIRECTS = true;

const ALWAYS_DEFAULT_PREFIXES = [
    '/auth',
    '/admin',
    '/dashboard',
    '/account',
    '/provider',
    '/onboarding',
    '/chat',
    '/my-bookings',
    '/api',
    '/lock',
    '/reviews',
];

function stripLocalePrefix(pathname: string): { locale: Locale; logicalPath: string } {
    for (const locale of LOCALES) {
        if (locale === DEFAULT_LOCALE) continue;
        if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
            return { locale, logicalPath: pathname.slice(`/${locale}`.length) || '/' };
        }
    }
    return { locale: DEFAULT_LOCALE, logicalPath: pathname };
}

function detectAcceptLanguage(req: NextRequest): Locale {
    const header = req.headers.get('accept-language') || '';
    const tags = header
        .split(',')
        .map((tag) => tag.split(';')[0].trim().toLowerCase())
        .filter(Boolean);
    for (const tag of tags) {
        const primary = tag.split('-')[0];
        if (isLocale(primary)) return primary;
    }
    return DEFAULT_LOCALE;
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const { locale, logicalPath } = stripLocalePrefix(pathname);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-locale', locale);

    const isAdminRoute = logicalPath.startsWith('/admin');
    const hasSessionCookie =
        req.cookies.has('authjs.session-token') ||
        req.cookies.has('__Secure-authjs.session-token') ||
        req.cookies.has('next-auth.session-token') ||
        req.cookies.has('__Secure-next-auth.session-token');
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });
    const isAuthenticated = Boolean(token);
    const isBanned = Boolean(token?.isBanned);
    const onboardingCompleted = token?.onboardingCompleted;
    const rawOnboardingType = typeof token?.onboardingType === 'string' ? token.onboardingType : null;
    const onboardingType = rawOnboardingType === 'SALON' ? 'SALON' : rawOnboardingType === 'INDIVIDUAL' ? 'INDIVIDUAL' : null;
    const isOnboardingRoute = logicalPath.startsWith('/onboarding');
    const isDashboardRoute = logicalPath.startsWith('/dashboard');
    const isAuthRoute = logicalPath.startsWith('/auth');
    const isApiRoute = logicalPath.startsWith('/api');
    const isPublicRoute =
        logicalPath === '/' ||
        logicalPath.startsWith('/salon') ||
        logicalPath.startsWith('/search') ||
        logicalPath.startsWith('/_next') ||
        logicalPath.startsWith('/become-pro');

    if (isBanned && !isPublicRoute && !isAuthRoute && !isApiRoute) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    if (token && token.role !== 'USER' && !onboardingCompleted) {
        if (
            isDashboardRoute ||
            logicalPath.startsWith('/provider') ||
            logicalPath.startsWith('/account') ||
            logicalPath.startsWith('/chat')
        ) {
            return NextResponse.redirect(new URL(`/onboarding?step=1`, req.url));
        }
    }

    // /admin has its own strict server-side guard; skip edge redirects to avoid
    // false unauth redirects caused by stale/unsynced JWT reads.
    if (isAdminRoute) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const protectedPrefixes = ['/dashboard', '/provider', '/chat', '/account'];
    const isProtected = protectedPrefixes.some((prefix) => logicalPath.startsWith(prefix));

    if (isProtected && !isAuthenticated && !hasSessionCookie) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const isAlwaysDefault = ALWAYS_DEFAULT_PREFIXES.some((prefix) => logicalPath.startsWith(prefix));

    // Accept-Language redirect for unprefixed public visits.
    if (ENABLE_LOCALE_REDIRECTS && locale === DEFAULT_LOCALE && !isAlwaysDefault) {
        const preferred = detectAcceptLanguage(req);
        if (isPrefixedLocale(preferred)) {
            const target = new URL(
                `/${preferred}${pathname === '/' ? '' : pathname}`,
                req.url,
            );
            target.search = req.nextUrl.search;
            return NextResponse.redirect(target, 308);
        }
    }

    // Default-locale rewrite: public routes live under [locale]/, but the default
    // locale (`ru`) stays unprefixed in the URL. Internally rewrite /<path> to
    // /ru/<path> so the [locale] tree matches. System routes (auth/admin/etc.)
    // live outside [locale] and must NOT be rewritten.
    if (locale === DEFAULT_LOCALE && !isAlwaysDefault) {
        const rewriteUrl = req.nextUrl.clone();
        rewriteUrl.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
        return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp|.*\\.ico).*)',
    ],
};
