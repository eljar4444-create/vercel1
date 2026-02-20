import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const { nextUrl } = req;

    const isApiRoute = nextUrl.pathname.startsWith('/api');
    const isStatic = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.');
    const isAuthPage = nextUrl.pathname.startsWith('/auth');

    if (isApiRoute || isStatic || isAuthPage) {
        return NextResponse.next();
    }

    // Keep middleware non-blocking. Access control is enforced server-side in pages/actions.
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
