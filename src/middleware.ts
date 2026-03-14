import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isAuthenticated = Boolean(req.auth?.user?.id);
    const isAdmin = req.auth?.user?.role === 'ADMIN';

    const protectedPrefixes = ['/dashboard', '/provider', '/chat', '/account'];
    const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
    const isAdminRoute = pathname.startsWith('/admin');

    if (isAdminRoute) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }

        if (!isAdmin) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    if (isProtectedRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/dashboard/:path*', '/provider/:path*', '/admin/:path*', '/chat/:path*', '/account/:path*'],
};
