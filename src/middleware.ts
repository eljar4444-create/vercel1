import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isAdminRoute = pathname.startsWith('/admin');
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
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isDashboardRoute = pathname.startsWith('/dashboard');
    const isAuthRoute = pathname.startsWith('/auth');
    const isApiRoute = pathname.startsWith('/api');
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/salon') ||
        pathname.startsWith('/search') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/become-pro');

    // Banned users are blocked from all protected routes
    if (isBanned && !isPublicRoute && !isAuthRoute && !isApiRoute) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // Require explicit onboarding completion for providers trying to access protected routes
    if (token && token.role !== 'USER' && !onboardingCompleted) {
        if (isDashboardRoute || pathname.startsWith('/provider') || pathname.startsWith('/account') || pathname.startsWith('/chat')) {
            return NextResponse.redirect(new URL(`/onboarding?step=1`, req.url));
        }
    }
    // /admin has its own strict server-side guard via auth() in src/app/admin/page.tsx.
    // Skip edge redirects here to avoid false unauth redirects caused by stale/unsynced JWT reads.
    if (isAdminRoute) {
        return NextResponse.next();
    }

    const protectedPrefixes = ['/dashboard', '/provider', '/chat', '/account'];
    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    // getToken() can return null in edge runtime even with a valid session cookie.
    // When we do have a session cookie, let route-level auth() guards decide.
    if (isProtected && !isAuthenticated && !hasSessionCookie) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
};
