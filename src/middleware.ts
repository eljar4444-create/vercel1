import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    const { nextUrl } = req;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const isLoggedIn = Boolean(token);
    const role = typeof token?.role === 'string' ? token.role : undefined;

    const isApiRoute = nextUrl.pathname.startsWith('/api');
    const isStatic = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.');
    const isAuthPage = nextUrl.pathname.startsWith('/auth');
    const isAdminPage = nextUrl.pathname.startsWith('/admin');
    const isClientPortal = nextUrl.pathname.startsWith('/my-bookings');
    const isDashboard = nextUrl.pathname.startsWith('/dashboard/');
    const isProviderArea = nextUrl.pathname.startsWith('/provider');

    if (isApiRoute || isStatic || isAuthPage) {
        return NextResponse.next();
    }

    if (isAdminPage) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/auth/login', nextUrl));
        }
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    if (isClientPortal) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/auth/login', nextUrl));
        }
        if (role !== 'CLIENT' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    if (isDashboard || isProviderArea) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/auth/login', nextUrl));
        }
        if (role !== 'PROVIDER' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
