import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isAdminRoute = pathname.startsWith('/admin');
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });
    const isAuthenticated = Boolean(token);
    const onboardingCompleted = token?.onboardingCompleted;
    const rawOnboardingType = typeof token?.onboardingType === 'string' ? token.onboardingType : null;
    const onboardingType = rawOnboardingType === 'SALON' ? 'SALON' : rawOnboardingType === 'INDIVIDUAL' ? 'INDIVIDUAL' : null;
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isAuthRoute = pathname.startsWith('/auth');
    const isApiRoute = pathname.startsWith('/api');
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/salon') ||
        pathname.startsWith('/search') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/become-pro');

    if (!onboardingCompleted && onboardingType) {
        if (!isOnboardingRoute && !isAuthRoute && !isApiRoute && !isPublicRoute && !isAdminRoute) {
            return NextResponse.redirect(new URL(`/onboarding?type=${onboardingType}`, req.url));
        }
    }
    // /admin has its own strict server-side guard via auth() in src/app/admin/page.tsx.
    // Skip edge redirects here to avoid false unauth redirects caused by stale/unsynced JWT reads.
    if (isAdminRoute) {
        return NextResponse.next();
    }

    const protectedPrefixes = ['/dashboard', '/provider', '/chat', '/account'];
    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isProtected && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
};
