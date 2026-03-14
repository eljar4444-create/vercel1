import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const sessionToken =
        req.cookies.get('authjs.session-token')?.value ||
        req.cookies.get('__Secure-authjs.session-token')?.value;

    const isAuthenticated = Boolean(sessionToken);

    if (pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }
    }

    const protectedPrefixes = ['/dashboard', '/provider', '/chat', '/account'];
    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isProtected && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/provider/:path*', '/admin/:path*', '/chat/:path*', '/account/:path*'],
};
